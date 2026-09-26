"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { FavoriteWithCover } from "@/lib/anime";

const PER_PAGE = 6;
const AUTO_MS = 12_000;

/** favorites, six at a time; flips through the pages on its own, pauses on hover */
export function FavoritesShelf({ items }: { items: FavoriteWithCover[] }) {
  const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (pages < 2 || paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), AUTO_MS);
    return () => clearInterval(id);
  }, [pages, paused]);

  const visible = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <div className="grid gap-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5" style={{ minHeight: 150 }}>
        {visible.map((f) => (
          <li key={f.id} className="text-[11px]">
            <a href={f.url} target="_blank" rel="noreferrer" className="block no-underline group">
              <div className="relative aspect-[2/3] border border-line bg-paper-2 overflow-hidden">
                {f.cover ? (
                  <img src={f.cover} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="grid place-items-center h-full text-[10px] text-ink-soft">no cover</div>
                )}
                {f.rating !== null && (
                  <span className="absolute top-1 right-1 chip text-[9px] px-1.5 bg-paper" title={f.own ? "my rating" : "community rating"}>
                    ★ {f.own ? `${f.rating}/10` : f.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="mt-1 truncate text-ink group-hover:text-accent">{f.title}</div>
              {f.note && <div className="text-[9px] text-ink-soft italic truncate">&quot;{f.note}&quot;</div>}
            </a>
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-[11px]">
          <button type="button" className="btn text-[11px]" onClick={() => setPage((p) => (p - 1 + pages) % pages)} aria-label="previous">
            ←
          </button>
          <span className="flex gap-1.5" role="tablist">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === page}
                onClick={() => setPage(i)}
                className="w-2 h-2 rounded-full border border-line cursor-pointer"
                style={{ background: i === page ? "var(--accent)" : "var(--paper)" }}
              />
            ))}
          </span>
          <button type="button" className="btn text-[11px]" onClick={() => setPage((p) => (p + 1) % pages)} aria-label="next">
            →
          </button>
        </div>
      )}
    </div>
  );
}
