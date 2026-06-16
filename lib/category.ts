import { Event, EventCategory } from "@/types/Event";

/**
 * Marker color categories, mapped to the official Tergar brand palette
 * (tergar.org brand guidelines). The spec's category structure is preserved;
 * the colors are aligned to the official palette per the chosen branding.
 *   Online Events        → Blue gradient  #8FB6F3 (online events are off-map)
 *   Community Activities → Tergar Blue     #1B4087
 *   Special Events       → Tergar Gold     #E39F24
 *   Selected Event       → Space Blue      #424A58
 */
export const MARKER_COLORS: Record<EventCategory, string> = {
  online: "#8FB6F3",
  community: "#1B4087",
  special: "#E39F24",
  selected: "#424A58",
};

const SPECIAL_KEYWORDS = [
  "special",
  "retreat",
  "empowerment",
  "teaching",
  "course",
  "intensive",
  "celebration",
  "festival",
  "anniversary",
];

/** Classify an event for marker styling. */
export function categorize(event: Event): Exclude<EventCategory, "selected"> {
  if (event.isOnlineOnly) return "online";
  const haystack = `${event.title} ${event.description}`.toLowerCase();
  if (SPECIAL_KEYWORDS.some((kw) => haystack.includes(kw))) return "special";
  return "community";
}

/** Resolve the marker color for an event, accounting for selection. */
export function markerColor(event: Event, selected: boolean): string {
  if (selected) return MARKER_COLORS.selected;
  return MARKER_COLORS[categorize(event)];
}
