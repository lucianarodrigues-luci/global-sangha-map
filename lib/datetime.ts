import { Event } from "@/types/Event";

/**
 * Date/time utilities (specs.md FR-003 date navigation, FR-010 timezone display).
 *
 * All functions are deterministic given an explicit timezone, so they behave
 * identically on the server and client (no hydration mismatch).
 */

/** Return YYYY-MM-DD for an ISO timestamp as observed in the given timezone. */
export function dateKeyInTimeZone(iso: string, timeZone?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${d}`;
  } catch {
    return iso.slice(0, 10);
  }
}

/** Local YYYY-MM-DD for a Date (used by the date picker / "today"). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Format the time portion of an ISO timestamp in a specific timezone. */
export function formatTimeInZone(iso: string, timeZone?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
}

// ── Wall-clock helpers ───────────────────────────────────────────────────────
// These read the time/date/offset directly from the ISO string as authored,
// WITHOUT re-projecting through a named timezone. Used for online events whose
// Google Calendar `timeZone` field is unreliable (it can disagree with the
// offset embedded in `dateTime`), so we honor exactly what was scheduled.

/** Parse the local components of an ISO string. */
function parseIso(iso: string) {
  const m = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?(Z|[+-]\d{2}:?\d{2})?/
  );
  if (!m) return null;
  return {
    date: `${m[1]}-${m[2]}-${m[3]}`,
    hour: Number(m[4]),
    minute: Number(m[5]),
    offset: m[6], // "Z", "+02:00", "-05:00", or undefined
  };
}

/** YYYY-MM-DD as authored (the organizer's local date). */
export function wallClockDateKey(iso: string): string {
  return parseIso(iso)?.date ?? iso.slice(0, 10);
}

/** "6:30 PM" — the authored wall-clock time, 12-hour. */
export function wallClockTime(iso: string): string {
  const p = parseIso(iso);
  if (!p) return "";
  const period = p.hour < 12 ? "AM" : "PM";
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return `${h12}:${String(p.minute).padStart(2, "0")} ${period}`;
}

/** "GMT-5" / "GMT+2" / "GMT+5:45" from the authored offset (or "" if none). */
export function wallClockOffsetLabel(iso: string): string {
  const off = parseIso(iso)?.offset;
  if (!off) return "";
  if (off === "Z") return "GMT";
  const sign = off[0];
  const [h, m] = off.slice(1).replace(":", " ").split(" ");
  const hh = Number(h);
  const mm = Number(m);
  return `GMT${sign}${hh}${mm ? `:${String(mm).padStart(2, "0")}` : ""}`;
}

/** Short timezone label, e.g. "GMT+1" or the IANA name. */
export function timeZoneLabel(iso: string, timeZone?: string): string {
  if (!timeZone) return "";
  const date = new Date(iso || Date.now());
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** A friendly full-date label for headings, e.g. "Saturday, June 14, 2026". */
export function formatLongDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/** Get the visitor's IANA timezone (client-side). */
export function getVisitorTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * The date an event "belongs to":
 *  - in-person/hybrid → the venue's local date (event.timezone is the venue zone)
 *  - online → the authored wall-clock date (the timeZone field is unreliable)
 */
export function eventDateKey(event: Event): string {
  return event.isOnlineOnly
    ? wallClockDateKey(event.startDate)
    : dateKeyInTimeZone(event.startDate, event.timezone);
}

/** Events whose start falls on the given date key. */
export function eventsForDate(events: Event[], dateKey: string): Event[] {
  return events.filter((e) => eventDateKey(e) === dateKey);
}

/** Add `n` days to a YYYY-MM-DD key, returning a new key. */
export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  return localDateKey(
    new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}
