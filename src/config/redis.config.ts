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

export async function initializeRedisClient(): Promise<RedisClient> {
  if (redisClient) return redisClient;

  const client = createClient({
    url: `rediss://${APP_CONFIG.redis.host}:${APP_CONFIG.redis.port}`,
    password: APP_CONFIG.redis.password || undefined,
  });

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
