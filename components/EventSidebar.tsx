"use client";

import { Event } from "@/types/Event";
import { EventCard } from "./EventCard";
import { formatLongDate } from "@/lib/datetime";

/**
 * Event sidebar (specs.md FR-008): all (map-able) events for the selected date.
 * Online-only events are shown separately in <OnlineEvents />.
 */
export function EventSidebar({
  events,
  selectedDate,
  visitorTimeZone,
  selectedEventId,
  onSelect,
}: {
  events: Event[];
  selectedDate: string;
  visitorTimeZone: string;
  selectedEventId: string | null;
  onSelect: (event: Event) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-midnight">Activities</h2>
        <p className="text-sm text-space-blue/70">{formatLongDate(selectedDate)}</p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-hairline bg-card/60 p-6 text-center text-sm text-space-blue/70">
          No in-person activities on this date.
          <br />
          Try another date or explore the online activities above.
        </div>
      ) : (
        <ul className="space-y-3 overflow-y-auto pr-1" aria-label="Events on selected date">
          {events.map((event) => (
            <li key={event.id}>
              <EventCard
                event={event}
                visitorTimeZone={visitorTimeZone}
                selected={event.id === selectedEventId}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
