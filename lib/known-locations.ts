/**
 * Curated overrides for Tergar community names whose place is ambiguous to a
 * general geocoder (e.g. "Madison" alone resolves to Madison County, Alabama
 * instead of Tergar Madison in Wisconsin).
 *
 * Each entry maps a keyword found in the event's title/location to an explicit,
 * unambiguous geocoding query ("City, State, Country"). This is consulted
 * BEFORE hitting Nominatim, so a match guarantees the right city.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MAINTENANCE: please confirm each city with the Tergar community and extend
 * this list. Entries marked `verify: true` are best-effort guesses that have
 * NOT been confirmed — verify or correct them before relying on the map.
 * ─────────────────────────────────────────────────────────────────────────
 */
export interface KnownLocation {
  /** Lowercase keyword to look for in the (normalized) location/title text. */
  keyword: string;
  /** Unambiguous query handed to the geocoder. */
  query: string;
  /** True when the mapping is an unconfirmed best-effort guess. */
  verify?: boolean;
}

export const KNOWN_LOCATIONS: KnownLocation[] = [
  // Confirmed / high-confidence.
  { keyword: "tergar madison", query: "Madison, Wisconsin, United States", verify: true },
  { keyword: "madison", query: "Madison, Wisconsin, United States", verify: true },
  { keyword: "tergar melbourne", query: "Melbourne, Victoria, Australia" },
  { keyword: "tergar new york", query: "New York, New York, United States" },
  { keyword: "east sussex", query: "East Sussex, England, United Kingdom" },
  { keyword: "tergar madrid", query: "Madrid, Spain" },
  { keyword: "tergar münchen", query: "Munich, Germany" },
  { keyword: "tergar munich", query: "Munich, Germany" },

  // NEEDS VERIFICATION — ambiguous city names; confirm the correct one.
  { keyword: "medford", query: "Medford, Oregon, United States", verify: true },
];

/** Normalize text for keyword matching (lowercase, strip diacritics/punct). */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * If `text` (event title or location) references a known Tergar center, return
 * the unambiguous geocoding query for it; otherwise undefined.
 * Longer keywords are matched first so "tergar madison" wins over "madison".
 */
export function knownLocationQuery(...texts: (string | undefined)[]): string | undefined {
  const haystack = normalize(texts.filter(Boolean).join(" "));
  if (!haystack) return undefined;
  const ordered = [...KNOWN_LOCATIONS].sort((a, b) => b.keyword.length - a.keyword.length);
  for (const entry of ordered) {
    if (haystack.includes(normalize(entry.keyword))) return entry.query;
  }
  return undefined;
}
