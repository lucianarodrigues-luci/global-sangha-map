"use client";

import { Event } from "@/types/Event";
import { JoinButton } from "./JoinButton";
import {
  formatTimeInZone,
  timeZoneLabel,
  wallClockTime,
  wallClockOffsetLabel,
} from "@/lib/datetime";

/**
 * Online events section (specs.md FR-006).
 * Section title is exactly "Online Global Activities".
 * These events do not appear on the map.
 */
export function OnlineEvents({
  events,
  visitorTimeZone,
}: {
  events: Event[];
  visitorTimeZone: string;
}) {
  if (events.length === 0) return null;

  return (
    <section aria-label="Online Global Activities" className="rounded-2xl bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="text-xl">
          💻
        </span>
        <h2 className="text-lg font-bold text-midnight sm:text-xl">
          Online Global Activities
        </h2>
        <span className="ml-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
          {events.length}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          // Online events: show the time exactly as authored (the calendar's
          // timeZone field is unreliable), not re-projected through a named zone.
          const time = wallClockTime(event.startDate);
          const tz = wallClockOffsetLabel(event.startDate);
          const localTime = formatTimeInZone(event.startDate, visitorTimeZone);
          const localTz = timeZoneLabel(event.startDate, visitorTimeZone);
          const showLocal =
            !event.allDay && Boolean(visitorTimeZone) && `${time} ${tz}` !== `${localTime} ${localTz}`;
          const hasCta = Boolean(event.joinUrl || event.contactEmail);
          return (
            <li
              key={event.id}
              className="flex flex-col gap-3 rounded-2xl border border-hairline bg-canvas p-4"
            >
              <h3 className="text-base font-semibold leading-snug text-midnight">
                {event.title}
              </h3>
              <p className="text-sm text-space-blue/80">
                🕑{" "}
                {event.allDay ? (
                  "All day"
                ) : (
                  <>
                    {time} {tz}
                    {showLocal && (
                      <span className="text-space-blue/60">
                        {" "}
                        · Your time: {localTime} {localTz}
                      </span>
                    )}
                  </>
                )}
              </p>
              <div className="mt-auto">
                {hasCta ? (
                  <JoinButton event={event} size="sm" />
                ) : (
                  <p className="text-xs italic text-muted">
                    No link provided — contact the community.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
