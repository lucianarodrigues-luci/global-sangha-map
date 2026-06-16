"use client";

import { Event } from "@/types/Event";
import { JoinButton } from "./JoinButton";
import { formatTimeInZone, timeZoneLabel } from "@/lib/datetime";

/**
 * Event card (specs.md FR-008).
 * Displays: Title, Time, Location, Join button.
 * Clicking the card centers the map and highlights the marker (handled by parent).
 * Times are shown in both the original timezone and the visitor's local
 * timezone (FR-010).
 */
export function EventCard({
  event,
  visitorTimeZone,
  selected,
  onSelect,
}: {
  event: Event;
  visitorTimeZone: string;
  selected: boolean;
  onSelect: (event: Event) => void;
}) {
  const originalTime = formatTimeInZone(event.startDate, event.timezone);
  const originalTz = timeZoneLabel(event.startDate, event.timezone);
  const localTime = formatTimeInZone(event.startDate, visitorTimeZone);
  const localTz = timeZoneLabel(event.startDate, visitorTimeZone);

  const showLocalSeparately =
    Boolean(visitorTimeZone) &&
    event.timezone !== visitorTimeZone &&
    originalTime !== localTime;

  const locationLabel = event.isOnlineOnly
    ? "Online"
    : [event.city, event.country].filter(Boolean).join(", ") || "Location TBD";

  return (
    <article
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(event);
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={selected}
      aria-label={`${event.title}, ${locationLabel}`}
      className={`animate-fadeIn cursor-pointer rounded-2xl border bg-card p-4 shadow-soft transition-all duration-200 hover:shadow-soft-lg ${
        selected ? "border-space-blue ring-2 ring-space-blue/30" : "border-hairline"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-midnight">
          {event.title}
        </h3>
        {event.isOnlineOnly && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            Online
          </span>
        )}
      </div>

      <dl className="mt-3 space-y-1.5 text-sm text-space-blue/80">
        <div className="flex items-center gap-2">
          <span aria-hidden="true">🕑</span>
          <dd>
            {originalTime}
            {originalTz ? ` ${originalTz}` : ""}
            {showLocalSeparately && (
              <span className="text-space-blue/60">
                {" "}
                · Your time: {localTime} {localTz}
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <span aria-hidden="true">📍</span>
          <dd>{locationLabel}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <JoinButton event={event} size="sm" />
      </div>
    </article>
  );
}
