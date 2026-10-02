/**
 * In-memory client-side cache and in-flight request deduplicator.
 * Safe for idempotent GET requests (hackathons list, stats, profile).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Executes a request with caching and in-flight deduplication.
 * @param key Unique cache key (e.g., API URL + query params)
 * @param fetcher Async function returning axios response or data
 * @param ttlMs Time-to-live in milliseconds (default 30 seconds)
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30000
): Promise<T> {
  // 1. Check valid cache
  const cached = memoryCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  // 2. Check deduplication for matching in-flight requests
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  // 3. Initiate request and register in in-flight map
  const promise = fetcher()
    .then((result) => {
      memoryCache.set(key, { data: result, timestamp: Date.now(), ttl: ttlMs });
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Invalidate a specific cache key or keys matching a prefix.
 */
export function invalidateCache(keyOrPrefix?: string): void {
  if (!keyOrPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      memoryCache.delete(key);
    }
  }
}
