import { getEvents } from "@/lib/calendar";
import { HomeClient } from "@/components/HomeClient";
import { localDateKey } from "@/lib/datetime";

/**
 * Home page (server component).
 *
 * Fetches and processes events on the server (calendar → parse → geocode) and
 * hands the result to the client orchestrator. The data fetch is cached and
 * revalidated every 6 hours (specs.md Caching Requirements).
 */
export const revalidate = 21600; // 6 hours

export default async function Page() {
  const { events, available } = await getEvents();
  // Default selected date = current day (specs.md FR-003).
  const initialDateKey = localDateKey(new Date());

  return (
    <HomeClient
      events={events}
      initialDateKey={initialDateKey}
      calendarUnavailable={!available}
    />
  );
}
