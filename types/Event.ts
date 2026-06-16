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
  /** Contact email used when no join URL is available. */
  contactEmail?: string;

  /** IANA timezone the event was authored in (e.g. "Europe/Madrid"). */
  timezone?: string;

  /** True when the event has no resolvable physical location. */
  isOnlineOnly: boolean;
}

/**
 * Marker categories used for map styling (see specs.md "Map Marker Colors").
 */
export type EventCategory = "online" | "community" | "special" | "selected";
