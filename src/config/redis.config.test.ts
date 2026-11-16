import { EventEmitter } from 'events';

class FakeRedisClient extends EventEmitter {
  connect = jest.fn().mockResolvedValue(undefined);
  disconnect = jest.fn().mockResolvedValue(undefined);
}

const createClient = jest.fn();

jest.mock('redis', () => ({ createClient: (...args: unknown[]) => createClient(...args) }));

describe('initializeRedisClient', () => {
  let fake: FakeRedisClient;

  beforeEach(async () => {
    jest.resetModules();
    fake = new FakeRedisClient();
    createClient.mockReset().mockReturnValue(fake);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const { initializeRedisClient } = await import('./redis.config');
    await initializeRedisClient();
  });

  afterEach(() => jest.restoreAllMocks());

  it('registers an error listener before connecting', () => {
    expect(fake.listenerCount('error')).toBeGreaterThan(0);
  });

  it('does not throw when the socket closes unexpectedly', () => {
    // With no 'error' listener EventEmitter throws, which our uncaughtException
    // handler turns into process.exit(1) — the production crash loop.
    expect(() => fake.emit('error', new Error('Socket closed unexpectedly'))).not.toThrow();
  });

  it('pings periodically so idle connections are not dropped by the provider', () => {
    const options = createClient.mock.calls[0][0];
    expect(options.pingInterval).toBeGreaterThan(0);
  });

  it('reconnects with a bounded backoff instead of giving up', () => {
    const { reconnectStrategy } = createClient.mock.calls[0][0].socket;
    expect(reconnectStrategy(1)).toBeGreaterThan(0);
    expect(reconnectStrategy(1000)).toBeLessThanOrEqual(10_000);
  });
});
