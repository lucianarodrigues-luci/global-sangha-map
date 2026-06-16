"use client";

import { addDays, formatLongDate, localDateKey } from "@/lib/datetime";

/**
 * Date navigation (specs.md FR-003):
 *   - View today's events (Today button; default selected date = current day)
 *   - View future events (next)
 *   - View previous dates (previous)
 *   - Select dates from a calendar picker (native date input)
 */
export function DateSelector({
  selectedDate,
  todayKey,
  onChange,
}: {
  selectedDate: string;
  todayKey: string;
  onChange: (dateKey: string) => void;
}) {
  const isToday = selectedDate === todayKey;

  return (
    <section
      aria-label="Date navigation"
      className="flex flex-col gap-3 rounded-2xl bg-card px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(addDays(selectedDate, -1))}
          aria-label="Previous day"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-space-blue transition-colors hover:bg-canvas"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div className="min-w-[14rem] text-center">
          <div className="text-base font-semibold text-midnight sm:text-lg">
            {formatLongDate(selectedDate)}
          </div>
          {isToday && (
            <div className="text-xs font-medium uppercase tracking-wide text-primary">
              Today
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(addDays(selectedDate, 1))}
          aria-label="Next day"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-space-blue transition-colors hover:bg-canvas"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(todayKey)}
          disabled={isToday}
          className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-primary"
        >
          Today
        </button>

        <label className="flex items-center gap-2 text-sm text-space-blue/80">
          <span className="sr-only sm:not-sr-only">Pick a date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onChange(e.target.value || localDateKey(new Date()))}
            aria-label="Select a date from the calendar"
            className="rounded-xl border border-hairline bg-canvas px-3 py-2 text-space-blue focus:border-primary focus:outline-none"
          />
        </label>
      </div>
    </section>
  );
}
