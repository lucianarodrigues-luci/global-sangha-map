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
const ONLINE_LOCATION_VALUES = [
  "online",
  "online only",
  "virtual",
  "virtual only",
  "zoom",
  "remote",
  "tbd",
  "tba",
  "n/a",
  "na",
  "-",
];

/**
 * Noise phrases that describe the *format* of an event, not its place. They are
 * stripped before geocoding so "Tergar Madison (Hybrid)" → "Tergar Madison" and
 * "East Sussex — in person" → "East Sussex".
 */
const FORMAT_NOISE = [
  "in person",
  "in-person",
  "inperson",
  "hybrid",
  "online",
  "virtual",
  "via zoom",
  "zoom",
  "livestream",
  "live stream",
  "webcast",
];

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
  joinUrlKind?: "zoom" | "registration" | "website";
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

  let joinUrl: string | undefined;
  let joinUrlKind: JoinInfo["joinUrlKind"];
  if (zoom[0]) {
    joinUrl = zoom[0];
    joinUrlKind = "zoom";
  } else if (registration[0]) {
    joinUrl = registration[0];
    joinUrlKind = "registration";
  } else if (website[0]) {
    joinUrl = website[0];
    joinUrlKind = "website";
  }

  const contactEmail = emails[0];

  return { joinUrl, joinUrlKind, contactEmail };
}

/**
 * True when an event offers an online way to attend (a Zoom link, or an
 * explicit online/hybrid signal in its text) — used to flag hybrid events that
 * ALSO have a physical location.
 */
export function hasOnlineComponent(
  joinInfo: JoinInfo,
  title: string | undefined,
  description: string | undefined
): boolean {
  if (joinInfo.joinUrlKind === "zoom") return true;
  const haystack = `${title ?? ""}\n${decodeHtml(description ?? "")}`.toLowerCase();
  return (
    haystack.includes("hybrid") ||
    haystack.includes("via zoom") ||
    haystack.includes("online") ||
    ONLINE_KEYWORDS.some((kw) => haystack.includes(kw))
  );
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
  "hybrid",
  "online",
  "virtual",
  "in person",
  "in-person",
  "inperson",
  "practice",
  "curriculum",
  "community",
  "center",
  "centre",
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

  // Only trust the high-precision "Tergar <Place>" pattern. We deliberately do
  // NOT fall back to geocoding arbitrary leftover title words: that produced
  // garbage placements (e.g. "White Tara" → Mexico, "Joy of Living" → a US
  // township). Centers whose name doesn't follow this pattern should be added
  // to KNOWN_LOCATIONS instead.
  const tergarMatch = title.match(/Tergar\s+([A-ZÀ-Ý][\wÀ-ÿ'’.-]*(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'’.-]*)?)/);
  if (tergarMatch) {
    const candidate = stripNoise(tergarMatch[1]);
    if (candidate) return candidate;
  }
  return undefined;
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
    const cleaned = cleanLocationQuery(loc);
    if (cleaned) return { query: cleaned, source: "location" };
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

/**
 * Strip format-noise ("hybrid", "online", "in person", "via zoom", …) and the
 * leftover separators from a location string so the geocoder sees only the
 * place. E.g. "Online, Tergar Melbourne" → "Tergar Melbourne",
 * "East Sussex — in person" → "East Sussex".
 */
export function cleanLocationQuery(input: string): string | undefined {
  let text = ` ${input} `;
  for (const phrase of FORMAT_NOISE) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi"), " ");
  }
  // Collapse separators/punctuation left dangling by removed words.
  text = text
    .replace(/[(){}\[\]]/g, " ")
    .replace(/\s*[,;|/–—-]+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  // Normalize: lowercase, drop surrounding punctuation/whitespace so values
  // like "Online," / "(online)" / "online -" are still recognized.
  const v = value
    .trim()
    .toLowerCase()
    .replace(/^[\s\-–—,;:.()[\]]+|[\s\-–—,;:.()[\]]+$/g, "");
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
