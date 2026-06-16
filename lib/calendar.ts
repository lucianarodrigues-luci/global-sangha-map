import { Event } from "@/types/Event";
import {
  detectJoinInfo,
  detectLocationQuery,
  looksOnlineOnly,
  decodeHtml,
} from "./parser";
import { geocode } from "./geocoder";
import sampleEventsRaw from "@/data/sample-events.json";

/**
 * Google Calendar integration (specs.md FR-002 + Caching Requirements).
 *
 * Reads events automatically from the public Tergar community calendar via the
 * Google Calendar API v3:
 *   - `singleEvents=true` expands recurring events into individual instances.
 *   - A time window covers recent past → near future so date navigation works.
 *   - The fetch is cached and revalidated every 6 hours.
 *
 * No manual event entry is required. If no API key is configured the app falls
 * back to bundled sample events so the UI still renders.
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

/** Convert sample JSON (relative offsets) into GCal-shaped events. */
function buildSampleGCalEvents(): GCalEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (sampleEventsRaw as Array<Record<string, unknown>>).map((s) => {
    const day = new Date(today);
    day.setDate(day.getDate() + Number(s.startOffsetDays ?? 0));
    const dayStr = day.toISOString().slice(0, 10);
    const start = `${dayStr}T${s.startTime}:00`;
    const end = `${dayStr}T${s.endTime}:00`;
    return {
      id: String(s.id),
      status: "confirmed",
      summary: String(s.summary ?? ""),
      description: String(s.description ?? ""),
      location: String(s.location ?? ""),
      start: { dateTime: start, timeZone: String(s.timeZone ?? "UTC") },
      end: { dateTime: end, timeZone: String(s.timeZone ?? "UTC") },
    } satisfies GCalEvent;
  });
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

  const { joinUrl, contactEmail } = detectJoinInfo(raw.description, raw.location);

  // Determine location query (FR-004 priority order).
  const explicitlyOnline = looksOnlineOnly(raw.location, title, raw.description);
  const locationQuery = explicitlyOnline
    ? { query: undefined, source: "none" as const }
    : detectLocationQuery(raw.location, title, raw.description);

  // Resolve coordinates (FR-005, cached permanently).
  const geo = explicitlyOnline ? undefined : await geocode(locationQuery.query);

  // FR-006: no valid/ resolvable location → online-only.
  const isOnlineOnly = explicitlyOnline || !geo;

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
    joinUrl,
    contactEmail,
    timezone: start.timezone || end.timezone,
    isOnlineOnly,
  };
}

/**
 * Public entry point: returns the full, processed list of events.
 * This is the single source of truth consumed by the page / API route.
 */
export async function getEvents(): Promise<Event[]> {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

  let rawEvents: GCalEvent[];
  let usingSampleData = false;

  if (apiKey) {
    try {
      rawEvents = await fetchGoogleCalendarEvents(apiKey);
    } catch (err) {
      console.error("[calendar] Falling back to sample data:", err);
      rawEvents = buildSampleGCalEvents();
      usingSampleData = true;
    }
  } else {
    console.warn(
      "[calendar] GOOGLE_CALENDAR_API_KEY not set — using bundled sample events."
    );
    rawEvents = buildSampleGCalEvents();
    usingSampleData = true;
  }

  // Geocoding is throttled (≤1 req/s) only for cache misses; resolve sequentially.
  const events: Event[] = [];
  for (const raw of rawEvents) {
    if (!raw.start) continue;
    events.push(await toDomainEvent(raw));
  }

  // Stable sort by start time.
  events.sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (usingSampleData) {
    // Marker so the UI can show a gentle "preview data" note if desired.
    (events as Event[] & { __sample?: boolean }).__sample = true;
  }

  return events;
}
