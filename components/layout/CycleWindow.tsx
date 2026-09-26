"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

export type CyclePage = { key: string; title: string; node: ReactNode; right?: ReactNode };

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

/**
 * A window whose title-bar dots switch between pages. All pages stay mounted (sockets, polling and
 * timers keep running), only the active one is visible. Auto-advances unless hovered.
 */
export function CycleWindow({ pages, autoMs = 12_000, minHeight }: { pages: CyclePage[]; autoMs?: number; minHeight?: number }) {
  const mounted = useMounted();
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = pages.length;

  useEffect(() => {
    if (!mounted || paused || count < 2 || autoMs <= 0) return;
    const id = setInterval(() => setPage((p) => (p + 1) % count), autoMs);
    return () => clearInterval(id);
  }, [mounted, paused, count, autoMs]);

  const current = pages[page % count];

  return (
    <section className="win" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="win-title">
        <span className="dots" role="tablist">
          {pages.map((p, i) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={i === page % count}
              aria-label={p.title}
              title={p.title}
              onClick={() => setPage(i)}
              className="w-2 h-2 rounded-full border border-line cursor-pointer transition-colors hover:bg-accent-2"
              style={{ background: i === page % count ? "var(--accent)" : "var(--paper)" }}
            />
          ))}
          {count < 3 && Array.from({ length: 3 - count }, (_, i) => <i key={`pad-${i}`} />)}
        </span>
        <span className="flex-1 truncate">{current.title}</span>
        {current.right}
      </div>
      <div className="win-body" style={minHeight ? { minHeight } : undefined}>
        {pages.map((p, i) => (
          <div key={p.key} hidden={i !== page % count}>
            {p.node}
          </div>
        ))}
      </div>
    </section>
  );
}
