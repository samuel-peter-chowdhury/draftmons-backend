import { Request } from 'express';
import { getRedisClient } from '../config/redis.config';

/**
 * Reference-data cache for near-static, cross-user endpoints (pokemon types,
 * generations, special move categories, per-generation Pokémon dex). Backed by the
 * shared Redis client in production; in dev — where no Redis client exists — it falls
 * back to an in-process Map that honors TTL and prefix invalidation so behavior matches
 * prod. This is NOT a general query cache: only the enumerated canonical request shapes
 * are cached (see the per-controller `getCacheKey`), and every write to a cached entity
 * invalidates its keys write-through (see the services' create/update/delete overrides).
 */
const KEY_PREFIX = 'draftmons:cache:';

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryEntry>();

export async function getCached<T>(key: string): Promise<T | null> {
  const fullKey = KEY_PREFIX + key;
  const client = getRedisClient();

  if (client) {
    const raw = await client.get(fullKey);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  const entry = memoryCache.get(fullKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(fullKey);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const fullKey = KEY_PREFIX + key;
  const serialized = JSON.stringify(value);
  const client = getRedisClient();

  if (client) {
    await client.set(fullKey, serialized, { EX: ttlSeconds });
    return;
  }

  memoryCache.set(fullKey, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Deletes every cache entry whose key starts with `prefix`. Callers pass a prefix that
 * ends at a natural boundary (a trailing colon) so, e.g., invalidating the gen-3 dex
 * (`pokemon:dex:generation:3:`) can never also clear gen 30's.
 */
export async function invalidate(prefix: string): Promise<void> {
  const fullPrefix = KEY_PREFIX + prefix;
  const client = getRedisClient();

  if (client) {
    const pattern = `${fullPrefix}*`;
    for await (const entry of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      // node-redis v4 yields a key per iteration; v5 yields a batch array. Handle both.
      const keys = Array.isArray(entry) ? entry : [entry];
      if (keys.length > 0) {
        await client.del(keys);
      }
    }
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(fullPrefix)) {
      memoryCache.delete(key);
    }
  }
}

const DEFAULT_TTL_SECONDS = 3600;

/**
 * Cache-aside helper: return the cached value for `key`, or run `produce()`, cache its
 * result, and return it. A `null` key skips the cache entirely (non-canonical request).
 */
export async function getOrSetCached<T>(
  key: string | null,
  produce: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<T> {
  if (!key) return produce();

  const cached = await getCached<T>(key);
  if (cached !== null) return cached;

  const fresh = await produce();
  await setCached(key, fresh, ttlSeconds);
  return fresh;
}

// ---------------------------------------------------------------------------
// Canonical cache-key builders + invalidation prefixes for reference lists
// ---------------------------------------------------------------------------

// Only a plain base list (pagination/sort, no filters, no full) is cacheable. Any query
// param outside this set means the request isn't the canonical shape → bypass the cache.
const ALLOWED_LIST_PARAMS = new Set(['page', 'pageSize', 'sortBy', 'sortOrder']);

/**
 * Cache key for a reference controller's base list, or `null` if the request carries any
 * parameter outside the canonical shape (a filter, `full=true`, etc.) and must bypass the
 * cache. Keyed by the pagination/sort signature so different pages/sorts never collide.
 */
export function referenceListCacheKey(entity: string, req: Request): string | null {
  if (req.query.full === 'true') return null;
  for (const param of Object.keys(req.query)) {
    if (!ALLOWED_LIST_PARAMS.has(param)) return null;
  }
  const page = req.query.page ?? '';
  const pageSize = req.query.pageSize ?? '';
  const sortBy = req.query.sortBy ?? '';
  const sortOrder = req.query.sortOrder ?? '';
  return `${entity}:list:page=${page}:pageSize=${pageSize}:sortBy=${sortBy}:sortOrder=${sortOrder}`;
}

export function referenceListInvalidationPrefix(entity: string): string {
  return `${entity}:list:`;
}

// Invalidation prefix for a single generation's cached dex (trailing colon so gen 3
// never matches gen 30). Mirrors the key built in PokemonController.getDexCacheKey.
export function pokemonDexInvalidationPrefix(generationId: number): string {
  return `pokemon:dex:generation:${generationId}:`;
}
