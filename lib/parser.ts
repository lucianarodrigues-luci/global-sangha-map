/**
 * Text parsing utilities (specs.md FR-004, FR-006, FR-009).
 *
 * - Location detection: Location field → Title → Description (priority order).
 * - Join-link detection with CTA priority: Zoom → Registration → Website → Email.
 * - Online-only classification.
 *
 * These are pure functions over raw calendar fields so they are easy to test
 * and reason about. Coordinate resolution happens separately in geocoder.ts.
 */

const ONLINE_KEYWORDS = [
  "online only",
  "online-only",
  "fully online",
  "virtual only",
  "virtual event",
  "online event",
  "webcast",
  "livestream",
  "live stream",
  "online via zoom",
];

/** Words/phrases that, when they make up the whole location, mean "no place". */
const ONLINE_LOCATION_VALUES = ["online", "virtual", "zoom", "remote", "tbd", "n/a"];

const URL_REGEX = /https?:\/\/[^\s<>")\]]+/gi;
const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** Strip trailing punctuation a URL regex may greedily capture. */
function cleanUrl(url: string): string {
  return url.replace(/[.,;:!?)\]]+$/, "");
}

/** Decode a few common HTML entities found in Google Calendar descriptions. */
export function decodeHtml(input: string): string {
  return input
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Join-link detection (FR-009)
// ─────────────────────────────────────────────────────────────────────────────

export interface JoinInfo {
  joinUrl?: string;
  contactEmail?: string;
}

function categorizeUrls(urls: string[]) {
  const zoom: string[] = [];
  const registration: string[] = [];
  const website: string[] = [];

  for (const raw of urls) {
    const url = cleanUrl(raw);
    const lower = url.toLowerCase();
    if (/zoom\.(us|com)/.test(lower)) {
      zoom.push(url);
    } else if (
      /(eventbrite|register|registration|signup|sign-up|rsvp|tickets?|forms\.gle|docs\.google\.com\/forms|typeform|meetup\.com)/.test(
        lower
      )
    ) {
      registration.push(url);
    } else {
      website.push(url);
    }
  }
  return { zoom, registration, website };
}

/**
 * Detect the best call-to-action from an event's text fields.
 * CTA priority: Zoom → Registration → Website → Email.
 */
export function detectJoinInfo(...texts: (string | undefined)[]): JoinInfo {
  const haystack = texts.filter(Boolean).join("\n");
  if (!haystack) return {};

  const urls = haystack.match(URL_REGEX) ?? [];
  const emails = (haystack.match(EMAIL_REGEX) ?? [])
    .map((e) => e.replace(/[.,;:!?)\]]+$/, ""))
    // Exclude emails that are actually part of a URL.
    .filter((e) => !urls.some((u) => u.includes(e)));

  const { zoom, registration, website } = categorizeUrls(urls);

  const joinUrl = zoom[0] || registration[0] || website[0];
  const contactEmail = emails[0];

  return { joinUrl, contactEmail };
}

// ─────────────────────────────────────────────────────────────────────────────
// Location detection (FR-004)
// ─────────────────────────────────────────────────────────────────────────────

/** Phrases stripped from a title to isolate a place name. */
const TITLE_NOISE = [
  "hosted by",
  "practice group",
  "community meditation",
  "community gathering",
  "meditation group",
  "meditation",
  "sangha",
  "group",
  "weekly",
  "monthly",
  "daily",
  "morning",
  "evening",
  "session",
  "with",
  "the",
];

/**
 * Best-effort extraction of a human-readable place from a free-text title.
 * Returns a query string suitable for geocoding, or undefined.
 *
 * Examples (from specs.md):
 *   "Hosted by Tergar Madrid"            → "Madrid"
 *   "Tergar São Paulo Practice Group"    → "São Paulo"
 *   "Vancouver Community Meditation"     → "Vancouver"
 */
export function extractLocationFromTitle(title: string | undefined): string | undefined {
  if (!title) return undefined;
  let text = ` ${title} `;

  // Prefer the token(s) immediately after "Tergar".
  const tergarMatch = title.match(/Tergar\s+([A-ZÀ-Ý][\wÀ-ÿ'’.-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’.-]*)?)/);
  if (tergarMatch) {
    const candidate = stripNoise(tergarMatch[1]);
    if (candidate) return candidate;
  }

  // Otherwise strip Tergar + known noise words and keep capitalized remainder.
  text = text.replace(/Tergar/gi, " ");
  const candidate = stripNoise(text);
  return candidate || undefined;
}

function stripNoise(input: string): string | undefined {
  let text = ` ${input.toLowerCase()} `;
  for (const phrase of TITLE_NOISE) {
    text = text.replace(new RegExp(`\\b${phrase}\\b`, "gi"), " ");
  }
  // Keep words from the original (preserving case/diacritics) that survived.
  const survivors = input
    .split(/\s+/)
    .filter((w) => {
      const wl = w.toLowerCase().replace(/[^\wà-ÿ'’.-]/gi, "");
      return wl && text.includes(` ${wl} `);
    })
    .join(" ")
    .replace(/[-–|:]+/g, " ")
    .trim();
  return survivors || undefined;
}

export interface LocationQuery {
  /** Free-text query passed to the geocoder. */
  query?: string;
  /** Source method that produced the query (for debugging/transparency). */
  source: "location" | "title" | "description" | "none";
}

/**
 * Determine the location query for an event using the spec's priority order.
 */
export function detectLocationQuery(
  rawLocation: string | undefined,
  title: string | undefined,
  description: string | undefined
): LocationQuery {
  // Method 1: explicit Location field.
  const loc = rawLocation?.trim();
  if (loc && !isOnlineLocationValue(loc)) {
    return { query: loc, source: "location" };
  }

  // Method 2: extract from title.
  const fromTitle = extractLocationFromTitle(title);
  if (fromTitle) {
    return { query: fromTitle, source: "title" };
  }

  // Method 3: extract from description.
  const fromDesc = extractLocationFromDescription(description);
  if (fromDesc) {
    return { query: fromDesc, source: "description" };
  }

  return { source: "none" };
}

/** Look for an explicit "Location: <place>" or "City: <place>" line in the body. */
export function extractLocationFromDescription(description: string | undefined): string | undefined {
  if (!description) return undefined;
  const text = decodeHtml(description);
  const labeled = text.match(/(?:location|city|where|venue)\s*[:\-]\s*([^\n]+)/i);
  if (labeled) {
    const value = labeled[1].trim();
    if (value && !isOnlineLocationValue(value)) return value;
  }
  return undefined;
}

function isOnlineLocationValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (ONLINE_LOCATION_VALUES.includes(v)) return true;
  // A bare URL in the location field means "online".
  if (/^https?:\/\//.test(v)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Online-only classification (FR-006)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True when the event explicitly signals it is online-only via its text.
 * (Absence of a resolvable location is handled by the caller after geocoding.)
 */
export function looksOnlineOnly(
  rawLocation: string | undefined,
  title: string | undefined,
  description: string | undefined
): boolean {
  if (rawLocation && isOnlineLocationValue(rawLocation)) return true;
  const haystack = `${title ?? ""}\n${decodeHtml(description ?? "")}`.toLowerCase();
  return ONLINE_KEYWORDS.some((kw) => haystack.includes(kw));
}
