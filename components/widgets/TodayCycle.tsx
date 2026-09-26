"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { DateBlock } from "./DateBlock";
import { Weather } from "./Weather";
import { JapanNow } from "./JapanNow";

const PAGES = [
  { key: "date", title: "today", node: <DateBlock /> },
  { key: "weather", title: "weather at my place", node: <Weather /> },
  { key: "japan", title: "meanwhile in japan", node: <JapanNow /> },
];
const AUTO_MS = 9000;

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/** "today" window: three pages, switch via the three dots in the title bar, auto-cycles until hovered/clicked. */
export function TodayCycle() {
  const mounted = useMounted();
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!mounted || paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % PAGES.length), AUTO_MS);
    return () => clearInterval(id);
  }, [mounted, paused]);

  return (
    <section className="win win-dashed" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="win-title">
        <span className="dots" role="tablist" aria-label="today pages">
          {PAGES.map((p, i) => (
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
        <span className="flex-1 truncate">{PAGES[page].title}</span>
        <span className="text-[10px] text-ink-soft">
          {page + 1}/{PAGES.length}
        </span>
      </div>
      <div className="win-body min-h-[156px] grid items-center">{PAGES[page].node}</div>
    </section>
  );
}
