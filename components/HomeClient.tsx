"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { Event } from "@/types/Event";
import { Header } from "./Header";
import { StatisticsBar, Stats } from "./StatisticsBar";
import { DateSelector } from "./DateSelector";
import { OnlineEvents } from "./OnlineEvents";
import { EventSidebar } from "./EventSidebar";
import { eventsForDate, getVisitorTimeZone } from "@/lib/datetime";

/**
 * Top-level client orchestrator. Holds shared UI state (selected date, selected
 * event, visitor timezone) and composes the layout described in specs.md
 * ("Layout Requirements" — Desktop and Mobile).
 *
 * The map is loaded client-only (ssr:false) because Leaflet touches `window`.
 */
const WorldMap = dynamic(() => import("./WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#eef1f4] text-space-blue/60">
      Loading map…
    </div>
  ),
});

function hasCoords(e: Event): boolean {
  return typeof e.latitude === "number" && typeof e.longitude === "number";
}

export function HomeClient({
  events,
  initialDateKey,
  calendarUnavailable,
}: {
  events: Event[];
  initialDateKey: string;
  calendarUnavailable: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDateKey);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  // Empty until the client resolves the visitor's timezone (avoids hydration
  // mismatch — the server has no notion of the visitor's locale).
  const [visitorTimeZone, setVisitorTimeZone] = useState("");

  useEffect(() => {
    setVisitorTimeZone(getVisitorTimeZone());
  }, []);

  const dayEvents = useMemo(
    () => eventsForDate(events, selectedDate),
    [events, selectedDate]
  );

  const onlineEvents = useMemo(
    () => dayEvents.filter((e) => e.isOnlineOnly),
    [dayEvents]
  );

  const mappableEvents = useMemo(
    () => dayEvents.filter((e) => !e.isOnlineOnly && hasCoords(e)),
    [dayEvents]
  );

  const stats: Stats = useMemo(() => {
    const countries = new Set(
      mappableEvents.map((e) => e.country).filter(Boolean) as string[]
    );
    return {
      activitiesToday: dayEvents.length,
      countriesRepresented: countries.size,
      onlineActivities: onlineEvents.length,
    };
  }, [dayEvents, mappableEvents, onlineEvents]);

  // Changing the date clears any stale selection.
  const handleDateChange = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSelectedEventId(null);
  };

  const handleSelect = (event: Event) => setSelectedEventId(event.id);

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-5 sm:py-8">
        {calendarUnavailable && (
          <p className="rounded-2xl border border-gold-tint bg-gold-tint/40 px-4 py-3 text-sm text-space-blue">
            We couldn&apos;t load events from the Tergar community calendar right
            now. Please try again later.
          </p>
        )}

        <StatisticsBar stats={stats} />

        <DateSelector
          selectedDate={selectedDate}
          todayKey={initialDateKey}
          onChange={handleDateChange}
        />

        <OnlineEvents events={onlineEvents} visitorTimeZone={visitorTimeZone} />

        {/* Desktop: Sidebar | Map. Mobile: Map then Event list. */}
        <div className="grid gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
          <div className="order-2 lg:order-1">
            <EventSidebar
              events={mappableEvents}
              selectedDate={selectedDate}
              visitorTimeZone={visitorTimeZone}
              selectedEventId={selectedEventId}
              onSelect={handleSelect}
            />
          </div>

          <div className="order-1 h-[55vh] overflow-hidden rounded-2xl border border-hairline shadow-soft lg:order-2 lg:h-[72vh]">
            <WorldMap
              events={mappableEvents}
              visitorTimeZone={visitorTimeZone}
              selectedEventId={selectedEventId}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <footer className="pt-4 text-center text-xs text-space-blue/50">
          Map data © OpenStreetMap contributors. A Tergar global sangha
          initiative.
        </footer>
      </main>
    </div>
  );
}
