import type { WatchLogStats } from "@/lib/anime-log";

/** a few counters and a short summary line */
export function WatchLog({ stats, profileEpisodes }: { stats: WatchLogStats; profileEpisodes: number | null }) {
  const allTime = Math.max(stats.total, profileEpisodes ?? 0);
  const since = stats.since ? new Date(stats.since).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
  return (
    <div className="grid gap-3 text-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <Stat value={stats.thisWeek} label="episodes this week" />
        <Stat value={stats.thisMonth} label="this month" />
        <Stat value={allTime} label="all time" />
        <Stat value={stats.finished.length} label="seasons finished" />
      </div>
      <p className="text-center text-[10px] text-ink-soft">
        {profileEpisodes && profileEpisodes > stats.total ? `${allTime} watched in total, ${stats.total} listed in detail` : `${stats.total} episodes on record`}
        {stats.imported ? ` · ${stats.imported} from before the log started` : ""}
        {since ? ` · dated since ${since}` : ""}
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border border-dashed border-line bg-paper-2 py-1.5">
      <div className="pixel text-xl text-accent-2">{value}</div>
      <div className="text-[10px] text-ink-soft">{label}</div>
    </div>
  );
}
