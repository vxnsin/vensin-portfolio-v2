"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

export type ShelfAnime = { title: string; url: string; cover: string | null };

/** a poster grid that shows the first few and folds the rest behind a "show all" button */
export function AnimeShelfGrid({ items, initial = 12 }: { items: ShelfAnime[]; initial?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, initial);
  return (
    <div className="grid gap-3">
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
        {shown.map((a) => (
          <li key={a.url} className="text-[11px]">
            <a href={a.url} target="_blank" rel="noreferrer" className="block no-underline group">
              <div className="relative aspect-[2/3] border border-line bg-paper-2 overflow-hidden">
                {a.cover ? (
                  <img src={a.cover} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="grid place-items-center h-full p-1 text-center text-[10px] text-ink-soft">{a.title}</div>
                )}
              </div>
              <div className="mt-1 truncate text-ink group-hover:text-accent">{a.title}</div>
            </a>
          </li>
        ))}
      </ul>
      {items.length > initial && (
        <button type="button" onClick={() => setAll((v) => !v)} className="btn w-fit text-[11px]">
          {all ? "show fewer" : `show all ${items.length}`}
        </button>
      )}
    </div>
  );
}
