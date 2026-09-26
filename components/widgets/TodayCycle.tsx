"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Health } from "@/lib/store";
import { DateBlock } from "./DateBlock";
import { Weather } from "./Weather";
import { JapanNow } from "./JapanNow";
import { ActivityRings } from "./ActivityRings";

const AUTO_MS = 9000;
// every page renders into the same fixed-height body so switching never moves the layout
export const PAGE_HEIGHT = 176;

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Page = { key: string; title: string; node: ReactNode };

/** "today" window: date, weather, and activity rings (or tokyo time until ring data exists). */
export function TodayCycle({ health }: { health: Health | null }) {
  const mounted = useMounted();
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  const pages: Page[] = [
    { key: "date", title: "today", node: <DateBlock /> },
    { key: "weather", title: "weather at my place", node: <Weather /> },
    health
      ? { key: "rings", title: "activity", node: <ActivityRings health={health} /> }
      : { key: "japan", title: "meanwhile in japan", node: <JapanNow /> },
  ];

  useEffect(() => {
    if (!mounted || paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages.length), AUTO_MS);
    return () => clearInterval(id);
  }, [mounted, paused, pages.length]);

  const current = pages[page % pages.length];

  return (
    <section className="win win-dashed" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="win-title">
        <span className="dots" role="tablist" aria-label="today pages">
          {pages.map((p, i) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={p.title}
              title={p.title}
              onClick={() => setPage(i)}
              className="w-2 h-2 rounded-full border border-line cursor-pointer transition-colors hover:bg-accent-2"
              style={{ background: i === page ? "var(--accent)" : "var(--paper)" }}
            />
          ))}
        </span>
        <span className="flex-1 truncate">{current.title}</span>
        <span className="text-[10px] text-ink-soft">
          {page + 1}/{pages.length}
        </span>
      </div>
      <div className="win-body grid items-center overflow-hidden" style={{ height: PAGE_HEIGHT }}>
        {current.node}
      </div>
    </section>
  );
}
