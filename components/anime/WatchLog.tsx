/* eslint-disable @next/next/no-img-element */
import type { WatchLogStats } from "@/lib/anime-log";

/** episodes per week for the last year as pixel bars, a few counters, and the seasons finished lately */
export function WatchLog({ stats }: { stats: WatchLogStats }) {
  const max = Math.max(1, ...stats.weekly);
  const since = stats.since ? new Date(stats.since).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
  return (
    <div className="grid gap-3 text-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <Stat value={stats.thisWeek} label="episodes this week" />
        <Stat value={stats.thisMonth} label="this month" />
        <Stat value={stats.thisYear} label="this year" />
        <Stat value={stats.finished.length} label="seasons finished" />
      </div>
      <div>
        <div className="flex items-end gap-px h-16 border-b border-dashed border-line" aria-label="episodes per week, last 52 weeks">
          {stats.weekly.map((n, i) => (
            <div key={i} className="flex-1 flex items-end" title={`${n} episode${n === 1 ? "" : "s"}, ${51 - i === 0 ? "this week" : `${51 - i} weeks ago`}`}>
              <div className="w-full" style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : 2, background: n ? (i === 51 ? "var(--accent)" : "var(--accent-2)") : "var(--line)" }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-ink-soft mt-1">
          <span>a year ago</span>
          <span>
            {stats.total} episodes on record{stats.imported ? ` · ${stats.imported} from before the log started` : ""}
            {since ? ` · dated since ${since}` : ""}
          </span>
          <span>this week</span>
        </div>
      </div>
      {stats.finished.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-ink-soft mb-1">finished lately</div>
          <ul className="flex gap-2 flex-wrap">
            {stats.finished.slice(0, 12).map((f) => (
              <li key={`${f.title}-${f.season}`}>
                <a href={f.url} target="_blank" rel="noreferrer" className="chip no-underline text-ink hover:text-accent">
                  {f.cover && <img src={f.cover} alt="" className="w-4 h-6 object-cover border border-line" />}
                  <span className="truncate max-w-[10rem]">{f.title}</span>
                  <span className="text-ink-soft">{f.season ? `S${f.season}` : ""} ✓</span>
                </a>
              </li>
            ))}
          </ul>
          {stats.finished.length > 12 && <p className="text-[10px] text-ink-soft mt-1">and {stats.finished.length - 12} more seasons finished before that.</p>}
        </div>
      )}
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
