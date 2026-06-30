import { Event } from "@/types/Event";
import {
  detectJoinInfo,
  detectLocationQuery,
  looksOnlineOnly,
  hasOnlineComponent,
  decodeHtml,
} from "./parser";
import { geocode } from "./geocoder";
import { knownLocationQuery } from "./known-locations";
import tzlookup from "tz-lookup";

/**
 * Resolve the IANA timezone of a physical venue from its coordinates so an
 * event's time is shown in the venue's LOCAL time (e.g. a New York event shows
 * New York time), regardless of which timezone it was authored in on Google
 * Calendar. Falls back to the authored timezone if lookup fails.
 */
function venueTimeZone(
  lat: number | undefined,
  lon: number | undefined,
  fallback?: string
): string | undefined {
  if (typeof lat !== "number" || typeof lon !== "number") return fallback;
  try {
    return tzlookup(lat, lon);
  } catch {
    return fallback;
  }
}
/**
 * Google Calendar integration (specs.md FR-002 + Caching Requirements).
 *
 * Reads events automatically from the public Tergar community calendar via the
 * Google Calendar API v3:
 *   - `singleEvents=true` expands recurring events into individual instances.
 *   - A time window covers recent past → near future so date navigation works.
 *   - The fetch is cached and revalidated every 6 hours.
 *
 * No manual event entry is required. If no API key is configured, or the API
 * call fails, the app shows NO events and signals that the calendar is
 * unavailable — it never falls back to fictitious sample data.
 */

const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3/calendars";
const SIX_HOURS_SECONDS = 6 * 60 * 60;
const PAST_WINDOW_DAYS = 30;
const FUTURE_WINDOW_DAYS = 120;

function calendarId(): string {
  return (
    process.env.GOOGLE_CALENDAR_ID ||
    "tergar.org_m5aemau76dov0it82j05fun6hg@group.calendar.google.com"
  );
}

// ── Google Calendar API response shapes (subset we use) ──────────────────────
interface GCalDateTime {
  date?: string; // all-day events: "YYYY-MM-DD"
  dateTime?: string; // timed events: RFC3339
  timeZone?: string;
}

interface GCalEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GCalDateTime;
  end?: GCalDateTime;
}

interface GCalResponse {
  items?: GCalEvent[];
  nextPageToken?: string;
}

/** Fetch raw events from the Google Calendar API, following pagination. */
async function fetchGoogleCalendarEvents(apiKey: string): Promise<GCalEvent[]> {
  const now = new Date();
  const timeMin = new Date(now.getTime() - PAST_WINDOW_DAYS * 86400000).toISOString();
  const timeMax = new Date(now.getTime() + FUTURE_WINDOW_DAYS * 86400000).toISOString();

  const items: GCalEvent[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${CALENDAR_API_BASE}/${encodeURIComponent(calendarId())}/events`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("singleEvents", "true"); // expand recurring events
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("showDeleted", "false");
    // Request only the fields we actually use. Keeps the response well under
    // Next.js's 2MB data-cache limit so the 6h fetch cache (revalidate above)
    // is honored instead of silently bypassed (the full payload is ~2.6MB).
    url.searchParams.set(
      "fields",
      "nextPageToken,items(id,status,summary,description,location,start,end)"
    );
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      // Calendar cache: refresh every 6 hours.
      next: { revalidate: SIX_HOURS_SECONDS },
    });

    if (!res.ok) {
      throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as GCalResponse;
    items.push(...(data.items ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items.filter((e) => e.status !== "cancelled");
}

function normalizeDateTime(dt: GCalDateTime | undefined): { iso: string; timezone?: string } {
  if (!dt) return { iso: "" };
  if (dt.dateTime) return { iso: dt.dateTime, timezone: dt.timeZone };
  if (dt.date) return { iso: `${dt.date}T00:00:00`, timezone: dt.timeZone };
  return { iso: "" };
}

/** Map one raw calendar event into our domain `Event`, resolving location. */
async function toDomainEvent(raw: GCalEvent): Promise<Event> {
  const title = (raw.summary ?? "Untitled Event").trim();
  const description = decodeHtml(raw.description ?? "");
  const start = normalizeDateTime(raw.start);
  const end = normalizeDateTime(raw.end);
  const allDay = Boolean(raw.start?.date && !raw.start?.dateTime);

  const joinInfo = detectJoinInfo(raw.description, raw.location, raw.summary);

  // Determine location query (FR-004 priority order). A curated override for
  // known Tergar centers takes precedence so ambiguous city names (e.g.
  // "Madison") resolve to the correct city.
  const explicitlyOnline = looksOnlineOnly(raw.location, title, raw.description);
  const locationQuery = explicitlyOnline
    ? undefined
    : knownLocationQuery(raw.location, title) ??
      detectLocationQuery(raw.location, title, raw.description).query;

  // Resolve coordinates (FR-005, cached permanently).
  const geo = explicitlyOnline ? undefined : await geocode(locationQuery);

  // FR-006: no valid/resolvable location → online-only. Otherwise, an event
  // with a place that ALSO has an online option is hybrid.
  const isOnlineOnly = explicitlyOnline || !geo;
  const isHybrid = !isOnlineOnly && hasOnlineComponent(joinInfo, title, raw.description);

  // For events with a physical venue, prefer the venue's local timezone so the
  // displayed time is the time *at the venue* (not whichever zone the event was
  // authored in). Online-only events keep their authored timezone.
  const authoredTz = start.timezone || end.timezone;
  const timezone = geo
    ? venueTimeZone(geo.latitude, geo.longitude, authoredTz)
    : authoredTz;

  return {
    id: raw.id,
    title,
    description,
    startDate: start.iso,
    endDate: end.iso || start.iso,
    city: geo?.city,
    country: geo?.country,
    latitude: geo?.latitude,
    longitude: geo?.longitude,
    joinUrl: joinInfo.joinUrl,
    joinUrlKind: joinInfo.joinUrlKind,
    contactEmail: joinInfo.contactEmail,
    timezone,
    isOnlineOnly,
    isHybrid,
    allDay,
  };
}

/** Result of {@link getEvents}: the processed events plus calendar status. */
export interface CalendarResult {
  events: Event[];
  /** False when no API key is configured or the Calendar API call failed. */
  available: boolean;
}

/**
 * Public entry point: returns the full, processed list of events and whether
 * the live calendar was reachable. This is the single source of truth consumed
 * by the page / API route. It never returns fictitious data — when the calendar
 * is unavailable it returns an empty list with `available: false` so the UI can
 * show a clear message.
 */
export async function getEvents(): Promise<CalendarResult> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

  if (!apiKey) {
    console.warn(
      "[calendar] GOOGLE_CALENDAR_API_KEY not set — calendar unavailable."
    );
    return { events: [], available: false };
  }

  let rawEvents: GCalEvent[];
  try {
    rawEvents = await fetchGoogleCalendarEvents(apiKey);
  } catch (err) {
    console.error("[calendar] Calendar unavailable:", err);
    return { events: [], available: false };
  }

  // Geocoding is throttled (≤1 req/s) only for cache misses; resolve sequentially.
  const events: Event[] = [];
  for (const raw of rawEvents) {
    if (!raw.start) continue;
    events.push(await toDomainEvent(raw));
  }

  // Stable sort by start time.
  events.sort((a, b) => a.startDate.localeCompare(b.startDate));

  return { events, available: true };
}
