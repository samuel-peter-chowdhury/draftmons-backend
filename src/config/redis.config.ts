import { createClient } from 'redis';
import { APP_CONFIG } from './app.config';

export type RedisClient = ReturnType<typeof createClient>;

/**
 * Single shared Redis client, owned here so both the session store (`app.ts`) and the
 * reference-data cache (`utils/cache.utils.ts`) use ONE connection instead of each
 * building its own. Constructed only in production (matching the session store's
 * production-only gating); in dev it stays null and the cache falls back to an
 * in-process Map (see `cache.utils.ts`).
 */
let redisClient: RedisClient | null = null;

// Keeps the connection from going idle long enough for the provider (Upstash) or an
// intermediate NAT to drop it.
const PING_INTERVAL_MS = 60_000;
const MAX_RECONNECT_DELAY_MS = 10_000;

export async function initializeRedisClient(): Promise<RedisClient> {
  if (redisClient) return redisClient;

  const client = createClient({
    url: `rediss://${APP_CONFIG.redis.host}:${APP_CONFIG.redis.port}`,
    password: APP_CONFIG.redis.password || undefined,
    pingInterval: PING_INTERVAL_MS,
    socket: {
      // Never give up: back off 100ms, 200ms, … capped at 10s.
      reconnectStrategy: (retries: number) => Math.min(retries * 100, MAX_RECONNECT_DELAY_MS),
    },
  });

  // REQUIRED. node-redis emits 'error' when the server closes the socket (e.g.
  // SocketClosedUnexpectedlyError). With no listener, EventEmitter throws, our
  // uncaughtException handler in server.ts exits the process, and Railway's
  // restart budget eventually runs out. With a listener, the client reconnects
  // on its own and queues commands until it is back.
  client.on('error', (error: Error) => {
    console.error('⚠️ Redis client error (will reconnect):', error.message);
  });
  client.on('reconnecting', () => console.warn('🔄 Redis reconnecting…'));
  client.on('ready', () => console.log('📦 Redis ready'));

  await client.connect();
  redisClient = client;
  return client;
}

export function getRedisClient(): RedisClient | null {
  return redisClient;
}

export async function disconnectRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
  }
}
