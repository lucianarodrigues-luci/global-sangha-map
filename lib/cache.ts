import { promises as fs } from "fs";
import path from "path";

/**
 * Permanent geocoding cache (specs.md FR-005 / Caching Requirements).
 *
 * Results are stored as a local JSON file so the same location is never
 * geocoded twice. A database is intentionally not used for the MVP.
 *
 * Deployment note: on Vercel's serverless runtime the application bundle is
 * read-only, so write-through persists only for the lifetime of a single
 * instance (and to /tmp where available). The committed seed file in
 * `data/geocode-cache.json` is always read first, which keeps geocoding cost
 * at zero for already-known locations. A durable KV/DB store is the production
 * path and is out of scope for the MVP.
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  /** True when Nominatim returned no match for the query. */
  notFound?: boolean;
}

type CacheShape = Record<string, GeocodeResult>;

const SEED_CACHE_PATH = path.join(process.cwd(), "data", "geocode-cache.json");
const TMP_CACHE_PATH = path.join("/tmp", "geocode-cache.json");

let memoryCache: CacheShape | null = null;

/** Normalize a location query so equivalent strings share one cache entry. */
export function cacheKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

async function readJsonSafe(filePath: string): Promise<CacheShape> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as CacheShape;
  } catch {
    return {};
  }
}

async function loadCache(): Promise<CacheShape> {
  if (memoryCache) return memoryCache;
  // Seed file (committed) takes precedence, then merge any /tmp write-through.
  const [seed, tmp] = await Promise.all([
    readJsonSafe(SEED_CACHE_PATH),
    readJsonSafe(TMP_CACHE_PATH),
  ]);
  memoryCache = { ...seed, ...tmp };
  return memoryCache;
}

export async function getCached(query: string): Promise<GeocodeResult | undefined> {
  const cache = await loadCache();
  return cache[cacheKey(query)];
}

export async function setCached(query: string, result: GeocodeResult): Promise<void> {
  const cache = await loadCache();
  cache[cacheKey(query)] = result;

  // Best-effort write-through. Try the committed file first (works in dev),
  // then fall back to /tmp (works on serverless). Failures are non-fatal.
  const payload = JSON.stringify(cache, null, 2);
  for (const target of [SEED_CACHE_PATH, TMP_CACHE_PATH]) {
    try {
      await fs.writeFile(target, payload, "utf-8");
      return;
    } catch {
      // try next target
    }
  }
}
