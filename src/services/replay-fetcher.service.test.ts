import 'reflect-metadata';
import { Container } from 'typedi';
import { ReplayFetcherService } from './replay-fetcher.service';
import {
  ValidationError,
  ReplayNotFoundError,
  ReplayPrivateError,
  ReplayTimeoutError,
  ReplayUpstreamError,
} from '../errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(response: { ok: boolean; status: number; json?: () => Promise<unknown> }) {
  const mockFn = jest.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: response.json ?? (() => Promise.resolve({})),
  });
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

function mockFetchReject(error: Error) {
  const mockFn = jest.fn().mockRejectedValue(error);
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

function abortError() {
  return Object.assign(new Error('aborted'), { name: 'AbortError' });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let service: ReplayFetcherService;

beforeEach(() => {
  Container.reset();
  service = new ReplayFetcherService();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// validateReplayUrl — pure URL validation (no network)
// ---------------------------------------------------------------------------

describe('validateReplayUrl', () => {
  const VALID_URL = 'https://replay.pokemonshowdown.com/gen9natdexdraft-2551726306';

  it('returns normalized id for a valid URL', () => {
    const id = service.validateReplayUrl(VALID_URL);
    expect(id).toBe('gen9natdexdraft-2551726306');
  });

  it('strips .json extension', () => {
    const id = service.validateReplayUrl(`${VALID_URL}.json`);
    expect(id).toBe('gen9natdexdraft-2551726306');
  });

  it('strips .log extension', () => {
    const id = service.validateReplayUrl(`${VALID_URL}.log`);
    expect(id).toBe('gen9natdexdraft-2551726306');
  });

  it('strips query string', () => {
    const id = service.validateReplayUrl(`${VALID_URL}?x=1`);
    expect(id).toBe('gen9natdexdraft-2551726306');
  });

  it('throws ValidationError for http:// (not https)', () => {
    expect(() =>
      service.validateReplayUrl('http://replay.pokemonshowdown.com/abc'),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for a completely different host', () => {
    expect(() => service.validateReplayUrl('https://evil.com/abc')).toThrow(ValidationError);
  });

  it('throws ValidationError for subdomain confusion attack', () => {
    expect(() =>
      service.validateReplayUrl('https://replay.pokemonshowdown.com.evil.com/abc'),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for subdomain of the allowed host', () => {
    expect(() =>
      service.validateReplayUrl('https://sub.replay.pokemonshowdown.com/abc'),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for credentials in URL', () => {
    expect(() =>
      service.validateReplayUrl('https://user@replay.pokemonshowdown.com/abc'),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for explicit non-default port', () => {
    expect(() =>
      service.validateReplayUrl('https://replay.pokemonshowdown.com:8080/abc'),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError for unparseable input', () => {
    expect(() => service.validateReplayUrl('not a url')).toThrow(ValidationError);
  });

  it('throws ValidationError for host-only URL with empty path (no replay id)', () => {
    expect(() =>
      service.validateReplayUrl('https://replay.pokemonshowdown.com/'),
    ).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// fetchReplay — fetch classification (mocked network)
// ---------------------------------------------------------------------------

describe('fetchReplay', () => {
  const VALID_URL = 'https://replay.pokemonshowdown.com/gen9natdexdraft-2551726306';
  const REPLAY_ID = 'gen9natdexdraft-2551726306';

  const VALID_REPLAY_JSON = {
    id: REPLAY_ID,
    format: 'gen9natdexdraft',
    players: ['ash', 'misty'],
    log: '|start\n|turn|1',
    uploadtime: 1700000000,
  };

  it('resolves with replay data on 200 response', async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve(VALID_REPLAY_JSON),
    });

    const promise = service.fetchReplay(VALID_URL);
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result.id).toBe(REPLAY_ID);
    expect(result.format).toBe('gen9natdexdraft');
    expect(result.players).toEqual(['ash', 'misty']);
    expect(result.log).toBeDefined();
  });

  it('throws ReplayNotFoundError on 404 response without retry', async () => {
    const mockFn = mockFetch({ ok: false, status: 404 });

    const promise = service.fetchReplay(VALID_URL);
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(ReplayNotFoundError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('throws ReplayPrivateError on 403 response without retry', async () => {
    const mockFn = mockFetch({ ok: false, status: 403 });

    const promise = service.fetchReplay(VALID_URL);
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(ReplayPrivateError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('throws ReplayUpstreamError on 500 response, retried exactly once', async () => {
    const mockFn = mockFetch({ ok: false, status: 500 });

    // Run the promise and advance all timers concurrently so the backoff sleep
    // resolves before the promise is fully awaited.
    await expect(
      Promise.all([
        service.fetchReplay(VALID_URL),
        jest.runAllTimersAsync(),
      ]),
    ).rejects.toThrow(ReplayUpstreamError);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('throws ReplayTimeoutError on AbortError, retried exactly once', async () => {
    const mockFn = mockFetchReject(abortError());

    await expect(
      Promise.all([
        service.fetchReplay(VALID_URL),
        jest.runAllTimersAsync(),
      ]),
    ).rejects.toThrow(ReplayTimeoutError);

    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('throws ValidationError for invalid URL before any network call', async () => {
    const mockFn = jest.fn();
    global.fetch = mockFn as unknown as typeof fetch;

    await expect(service.fetchReplay('not a url')).rejects.toThrow(ValidationError);
    expect(mockFn).not.toHaveBeenCalled();
  });

  it('throws ValidationError for http URL before any network call', async () => {
    const mockFn = jest.fn();
    global.fetch = mockFn as unknown as typeof fetch;

    await expect(
      service.fetchReplay('http://replay.pokemonshowdown.com/abc'),
    ).rejects.toThrow(ValidationError);
    expect(mockFn).not.toHaveBeenCalled();
  });
});
