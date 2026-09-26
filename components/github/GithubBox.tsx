"use client";

import { useEffect, useRef, useState } from "react";
import type { ContributionYears, Contributions, LatestActivity } from "@/lib/github";
import { relativeTime } from "@/lib/github";

const LEVEL_ALPHA = [0.12, 0.35, 0.55, 0.78, 1];
const CELL = 10;
const GAP = 2;

function Heatmap({ c }: { c: Contributions }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // newest weeks on the right; start scrolled to the end on narrow screens
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [c]);

  // pad the first week so columns start on sunday like github does
  const firstDow = new Date(c.days[0].date + "T00:00:00").getDay();
  const cells: Array<(typeof c.days)[number] | null> = [...Array(firstDow).fill(null), ...c.days];
  const weeks: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const months: Array<{ label: string; col: number }> = [];
  weeks.forEach((w, col) => {
    const first = w.find(Boolean);
    if (!first) return;
    const d = new Date(first.date + "T00:00:00");
    const label = d.toLocaleString("en", { month: "short" }).toLowerCase();
    if (d.getDate() <= 7 && (months.length === 0 || months[months.length - 1].label !== label)) months.push({ label, col });
  });

  return (
    <div className="grid gap-2">
      <div ref={scroller} className="overflow-x-auto scroll-y pb-1">
        <div className="relative" style={{ width: weeks.length * (CELL + GAP), paddingTop: 12 }}>
          {months.map((m) => (
            <span key={m.label + m.col} className="absolute top-0 text-[9px] text-ink-soft" style={{ left: m.col * (CELL + GAP) }}>
              {m.label}
            </span>
          ))}
          <div className="grid grid-flow-col" style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP }}>
            {weeks.map((w, wi) =>
              Array.from({ length: 7 }, (_, di) => {
                const d = w[di];
                return (
                  <span
                    key={`${wi}-${di}`}
                    title={d ? `${d.count} contribution${d.count === 1 ? "" : "s"} on ${d.date}` : undefined}
                    className="block rounded-[2px]"
                    style={{
                      width: CELL,
                      height: CELL,
                      background: d ? `color-mix(in srgb, var(--accent) ${LEVEL_ALPHA[d.level] * 100}%, var(--paper-2))` : "transparent",
                      border: d ? "1px solid color-mix(in srgb, var(--line) 40%, transparent)" : undefined,
                    }}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
        <span>
          <b className="text-ink">{c.total}</b> contributions
        </span>
        <span>
          streak <b className="text-ink">{c.streak}</b> day{c.streak === 1 ? "" : "s"}
        </span>
        {c.best && (
          <span>
            best day <b className="text-ink">{c.best.count}</b> ({c.best.date})
          </span>
        )}
      </div>
    </div>
  );
}

function Latest({ gh }: { gh: LatestActivity }) {
  if (!gh) return <p className="text-ink-soft">github is being shy right now.</p>;
  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <a href={gh.url} target="_blank" rel="noreferrer" className="pixel text-sm">
          {gh.repo}
        </a>
        {gh.language && <span className="chip text-[10px]">{gh.language}</span>}
        <span className="text-ink-soft">{relativeTime(gh.pushedAt)}</span>
      </div>
      {gh.description && <div className="text-ink-soft">{gh.description}</div>}
      {gh.commit && (
        <div className="truncate">
          <span className="text-ink-soft">last commit:</span>{" "}
          <a href={gh.commit.url} target="_blank" rel="noreferrer" title={gh.commit.message}>
            {gh.commit.message}
          </a>
        </div>
      )}
    </div>
  );
}

/** GitHub window with two pages: latest own commit, and the contribution calendar per year. */
export function GithubBox({ gh, contributions }: { gh: LatestActivity; contributions: ContributionYears | null }) {
  const [page, setPage] = useState(0);
  const [year, setYear] = useState(contributions?.years[0] ?? new Date().getFullYear());
  const hasActivity = Boolean(contributions);
  const pages = hasActivity ? ["latest on github", `github activity · ${year}`] : ["latest on github"];

  return (
    <section className="win win-dashed">
      <div className="win-title">
        <span className="dots" role="tablist" aria-label="github pages">
          {pages.map((title, i) => (
            <button
              key={title}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={title}
              title={title}
              onClick={() => setPage(i)}
              className="w-2 h-2 rounded-full border border-line cursor-pointer transition-colors hover:bg-accent-2"
              style={{ background: i === page ? "var(--accent)" : "var(--paper)" }}
            />
          ))}
        </span>
        <span className="flex-1 truncate">{pages[page]}</span>
        {hasActivity && (
          <button type="button" onClick={() => setPage((p) => (p + 1) % pages.length)} className="text-[10px] text-ink-soft hover:text-accent cursor-pointer">
            {page === 0 ? "activity →" : "← latest"}
          </button>
        )}
      </div>
      <div className="win-body text-xs grid items-center" style={{ minHeight: 118 }}>
        {page === 0 || !contributions ? (
          <Latest gh={gh} />
        ) : (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {contributions.years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className="chip cursor-pointer hover:bg-accent-soft text-[11px]"
                  style={year === y ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
                >
                  {y}
                </button>
              ))}
            </div>
            <Heatmap c={contributions.byYear[year] ?? contributions.byYear[contributions.years[0]]} />
          </div>
        )}
      </div>
    </section>
  );
}
