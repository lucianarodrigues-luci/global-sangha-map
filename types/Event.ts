/**
 * Core domain model for a Tergar community activity.
 * Matches the data model defined in specs.md.
 */
export interface Event {
  id: string;

  title: string;
  description: string;

  /** ISO 8601 start timestamp (with timezone offset when available). */
  startDate: string;
  /** ISO 8601 end timestamp (with timezone offset when available). */
  endDate: string;

  city?: string;
  country?: string;

  latitude?: number;
  longitude?: number;

  /** Best call-to-action URL (Zoom > Registration > Website). */
  joinUrl?: string;
  /** What kind of link `joinUrl` is, so the UI can label it correctly. */
  joinUrlKind?: "zoom" | "registration" | "website";
  /** Contact email used when no join URL is available. */
  contactEmail?: string;

  /** IANA timezone the event was authored in (e.g. "Europe/Madrid"). */
  timezone?: string;

  /** True when the event has no resolvable physical location. */
  isOnlineOnly: boolean;
  /**
   * True when the event has BOTH a physical location and an online way to
   * attend (Zoom link or an explicit "hybrid"/"online" signal). Mutually
   * exclusive with `isOnlineOnly`.
   */
  isHybrid: boolean;

  /** True for all-day events (no meaningful clock time). */
  allDay: boolean;
}

/** How an attendee can take part — drives badges and CTA wording. */
export type EventMode = "online" | "in_person" | "hybrid";

/** Resolve the attendance mode for an event. */
export function eventMode(event: Event): EventMode {
  if (event.isOnlineOnly) return "online";
  return event.isHybrid ? "hybrid" : "in_person";
}

/**
 * Marker categories used for map styling (see specs.md "Map Marker Colors").
 */
export type EventCategory = "online" | "community" | "special" | "selected";
