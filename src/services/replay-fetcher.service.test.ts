import 'reflect-metadata';
import { Container } from 'typedi';
import { ReplayFetcherService } from './replay-fetcher.service';
import {
  ValidationError,
  ReplayNotFoundError,
  ReplayParseError,
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

interface StubResponse {
  status?: number;
  body?: string;
  /** Final URL, for exercising the redirect-off-allowlist guard. */
  url?: string;
}

/**
 * Routes fetch by exact endpoint URL — needed for the raw-log strategy, which
 * probes `….log` first and only then the replay page.
 */
function mockFetchByUrl(routes: Record<string, StubResponse>) {
  const mockFn = jest.fn().mockImplementation((endpoint: string) => {
    const route = routes[endpoint] ?? { status: 404 };
    const status = route.status ?? 200;
    const body = route.body ?? '';

    return Promise.resolve({
      ok: status < 400,
      status,
      url: route.url ?? endpoint,
      text: () => Promise.resolve(body),
      json: () => Promise.resolve(JSON.parse(body || '{}')),
    });
  });
  global.fetch = mockFn as unknown as typeof fetch;
  return mockFn;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let service: ReplayFetcherService;

beforeEach(() => {
  Container.reset();
  delete process.env.REPLAY_ALLOWED_HOSTS;
  service = new ReplayFetcherService();
  jest.useFakeTimers();
});

afterEach(() => {
  delete process.env.REPLAY_ALLOWED_HOSTS;
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

  it('throws ValidationError when an allowed host redirects off the allowlist', async () => {
    mockFetchByUrl({
      [`${VALID_URL}.json`]: { body: '{}', url: 'https://evil.com/steal' },
    });

    const promise = service.fetchReplay(VALID_URL);
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// Third-party replay hosts — `.html` replays read via the raw-log strategy
// ---------------------------------------------------------------------------

describe('third-party .html replays', () => {
  const HTML_URL =
    'https://champsnatdex.dedyn.io/replays/gen9natdexchampionsou/27473_Cosinity_vs_Noremacris.html';
  const LOG_ENDPOINT = `${HTML_URL}.log`;
  const REPLAY_ID = '27473_Cosinity_vs_Noremacris';

  // Header lines the fetcher reads back to rebuild Showdown's JSON shape.
  const RAW_LOG = [
    '|j|☆Cosinity',
    '|t:|1786737781',
    '|player|p1|Cosinity|pokemonbreeder||pokeball,Poke Ball III,0,1000',
    '|player|p2|Noremacris|hiker-gen4||pokeball,Poke Ball III,0,1000',
    '|tier|[Gen 9] NatDex Champions OU',
    '|turn|1',
    '|t:|1786737853',
    '|win|Cosinity',
  ].join('\n');

  it('accepts an allowlisted third-party host and ids it by final path segment', () => {
    expect(service.validateReplayUrl(HTML_URL)).toBe(REPLAY_ID);
  });

  it('still rejects a host that is not on the allowlist', () => {
    expect(() =>
      service.validateReplayUrl('https://evil.com/replays/gen9ou/1_a_vs_b.html'),
    ).toThrow(ValidationError);
  });

  it('extends the allowlist from REPLAY_ALLOWED_HOSTS', () => {
    process.env.REPLAY_ALLOWED_HOSTS = ' my-league.example ,other.example ';
    const extended = new ReplayFetcherService();

    expect(extended.validateReplayUrl('https://my-league.example/replays/gen9ou/1_a_vs_b.html')).toBe(
      '1_a_vs_b',
    );
    // Default hosts survive the extension.
    expect(extended.validateReplayUrl('https://replay.pokemonshowdown.com/gen9ou-1')).toBe(
      'gen9ou-1',
    );
  });

  it('appends .log to the full .html path and synthesizes the JSON shape', async () => {
    const mockFn = mockFetchByUrl({ [LOG_ENDPOINT]: { body: RAW_LOG } });

    const promise = service.fetchReplay(HTML_URL);
    jest.runAllTimersAsync();
    const result = await promise;

    // `.html` must be kept — these servers only resolve `….html.log`.
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn.mock.calls[0][0]).toBe(LOG_ENDPOINT);

    expect(result.id).toBe(REPLAY_ID);
    expect(result.players).toEqual(['Cosinity', 'Noremacris']);
    expect(result.format).toBe('[Gen 9] NatDex Champions OU');
    expect(result.uploadtime).toBe(1786737781);
    expect(result.log).toBe(RAW_LOG);
  });

  it('falls back to the page’s embedded battle-log-data when .log 404s', async () => {
    const mockFn = mockFetchByUrl({
      [LOG_ENDPOINT]: { status: 404 },
      [HTML_URL]: {
        body:
          '<!DOCTYPE html><title>x</title>' +
          `<script type="text/plain" class="battle-log-data">${RAW_LOG}\n</script>` +
          '<script src="/js/replay-embed.js"></script>',
      },
    });

    const promise = service.fetchReplay(HTML_URL);
    jest.runAllTimersAsync();
    const result = await promise;

    expect(mockFn.mock.calls.map((c) => c[0])).toEqual([LOG_ENDPOINT, HTML_URL]);
    expect(result.players).toEqual(['Cosinity', 'Noremacris']);
    expect(result.log).toBe(RAW_LOG);
  });

  it('falls back to the page when .log answers 200 with an HTML body', async () => {
    mockFetchByUrl({
      [LOG_ENDPOINT]: { body: '<!doctype html><html>not a log</html>' },
      [HTML_URL]: {
        body: `<script type="text/plain" class="battle-log-data">${RAW_LOG}</script>`,
      },
    });

    const promise = service.fetchReplay(HTML_URL);
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result.log).toBe(RAW_LOG);
  });

  it('decodes HTML entities in the embedded log', async () => {
    mockFetchByUrl({
      [LOG_ENDPOINT]: { status: 404 },
      [HTML_URL]: {
        body:
          '<script type="text/plain" class="battle-log-data">' +
          '|player|p1|A&amp;B|x||\n|player|p2|C&lt;D|y||\n|tier|[Gen 9] OU' +
          '</script>',
      },
    });

    const promise = service.fetchReplay(HTML_URL);
    jest.runAllTimersAsync();
    const result = await promise;

    expect(result.players).toEqual(['A&B', 'C<D']);
  });

  it('throws ReplayParseError when the log has fewer than two players', async () => {
    mockFetchByUrl({ [LOG_ENDPOINT]: { body: '|tier|[Gen 9] OU\n|turn|1' } });

    const promise = service.fetchReplay(HTML_URL);
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(ReplayParseError);
  });

  it('throws ReplayNotFoundError when neither the log nor the page exists', async () => {
    mockFetchByUrl({});

    const promise = service.fetchReplay(HTML_URL);
    jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow(ReplayNotFoundError);
  });

  it('does not double-append .log when the URL already ends in .log', async () => {
    const mockFn = mockFetchByUrl({ [LOG_ENDPOINT]: { body: RAW_LOG } });

    const promise = service.fetchReplay(LOG_ENDPOINT);
    jest.runAllTimersAsync();
    const result = await promise;

    expect(mockFn.mock.calls[0][0]).toBe(LOG_ENDPOINT);
    // Both suffixes are stripped off the id.
    expect(result.id).toBe(REPLAY_ID);
  });
});
