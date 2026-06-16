/**
 * Statistics bar (specs.md "Statistics Bar"):
 *   🌍 N Activities Today
 *   🌎 N Countries Represented
 *   💻 N Online Activities
 */
export interface Stats {
  activitiesToday: number;
  countriesRepresented: number;
  onlineActivities: number;
}

function StatItem({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-soft">
      <span className="text-2xl sm:text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <div>
        <div className="text-2xl font-bold leading-none text-midnight sm:text-3xl">
          {value}
        </div>
        <div className="mt-1 text-xs font-medium uppercase tracking-wide text-space-blue/70 sm:text-sm">
          {label}
        </div>
      </div>
    </div>
  );
}

export function StatisticsBar({ stats }: { stats: Stats }) {
  return (
    <section
      aria-label="Sangha activity statistics"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
    >
      <StatItem emoji="🌍" value={stats.activitiesToday} label="Activities Today" />
      <StatItem
        emoji="🌎"
        value={stats.countriesRepresented}
        label="Countries Represented"
      />
      <StatItem emoji="💻" value={stats.onlineActivities} label="Online Activities" />
    </section>
  );
}
