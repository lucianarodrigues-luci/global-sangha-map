import { getCached, setCached, GeocodeResult } from "./cache";

/**
 * Geocoding via the OpenStreetMap Nominatim API (specs.md FR-005).
 *
 * - Results are cached permanently so the same location is never geocoded twice.
 * - Nominatim's usage policy requires an identifying User-Agent and a maximum
 *   of one request per second; both are honored here.
 */

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const MIN_REQUEST_INTERVAL_MS = 1100; // ≤ 1 request/second per Nominatim policy.

let lastRequestAt = 0;

function contactEmail(): string {
  return process.env.NOMINATIM_CONTACT_EMAIL || "contact@tergar.org";
}

function userAgent(): string {
  return `GlobalSanghaMap/1.0 (${contactEmail()})`;
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - now;
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestAt = Date.now();
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  addresstype?: string;
  address?: NominatimAddress;
}

/** A real settlement name from a Nominatim address, if any. */
function settlementName(addr: NominatimAddress): string | undefined {
  return addr.city || addr.town || addr.village || addr.municipality;
}

/**
 * Pick the best candidate from Nominatim's (importance-sorted) results.
 * Prefer the first result that resolves to an actual settlement (city/town/
 * village) over one that is only a county/state/region — this is what keeps
 * "Madison" on the city in Wisconsin instead of Madison County, Alabama.
 */
function pickBestCandidate(results: NominatimResult[]): NominatimResult | undefined {
  if (!results.length) return undefined;
  const withSettlement = results.find((r) => settlementName(r.address ?? {}));
  return withSettlement ?? results[0];
}

/**
 * Resolve a free-text location string to coordinates + city/country.
 * Returns `undefined` when the location cannot be resolved (caller treats this
 * as an online-only event).
 */
export async function geocode(query: string | undefined): Promise<GeocodeResult | undefined> {
  if (!query || !query.trim()) return undefined;

  // Permanent cache — never geocode the same location twice.
  const cached = await getCached(query);
  if (cached) {
    return cached.notFound ? undefined : cached;
  }

  try {
    await throttle();
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    // Fetch a few candidates so we can prefer a real settlement over a
    // county/state match (see pickBestCandidate).
    url.searchParams.set("limit", "5");
    url.searchParams.set("email", contactEmail());

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": userAgent(),
        "Accept-Language": "en",
      },
      // Geocoding results are stable; allow Next to cache the fetch.
      next: { revalidate: false },
    });

    if (!res.ok) {
      return undefined;
    }

    const data = (await res.json()) as NominatimResult[];
    const top = pickBestCandidate(data);
    if (!top) {
      // Remember the miss so we don't retry it every refresh.
      await setCached(query, { latitude: 0, longitude: 0, notFound: true });
      return undefined;
    }

    const addr = top.address ?? {};
    const result: GeocodeResult = {
      latitude: parseFloat(top.lat),
      longitude: parseFloat(top.lon),
      city: settlementName(addr) || addr.state,
      country: addr.country,
    };

    await setCached(query, result);
    return result;
  } catch {
    // Network/Nominatim errors are non-fatal — event simply won't be mapped.
    return undefined;
  }
}
