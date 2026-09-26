"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/store";

export function Gallery({ items }: { items: GalleryItem[] }) {
  const tags = Array.from(new Set(items.map((i) => i.tag).filter(Boolean)));
  const [tag, setTag] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(null);

  const visible = tag === "all" ? items : items.filter((i) => i.tag === tag);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % visible.length));
      if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + visible.length) % visible.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, visible.length]);

  if (items.length === 0) return <p className="text-xs text-ink-soft">no photos yet. soon™</p>;

  return (
    <div className="grid gap-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-ink-soft mr-1">show:</span>
          {["all", ...tags].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTag(t);
                setOpen(null);
              }}
              className="chip cursor-pointer hover:bg-accent-soft"
              style={tag === t ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {visible.map((it, i) => (
          <li key={it.id}>
            <button type="button" onClick={() => setOpen(i)} className="block w-full text-left group cursor-pointer">
              <div className="aspect-square border border-line bg-paper-2 overflow-hidden">
                <img src={it.url} alt={it.caption} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              {it.caption && <div className="mt-1 text-[11px] truncate group-hover:text-accent">{it.caption}</div>}
            </button>
          </li>
        ))}
      </ul>

      {open !== null && visible[open] && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(0,0,0,.75)" }} onClick={() => setOpen(null)} role="dialog" aria-modal>
          <figure className="win max-w-[92vw] max-h-[90vh] grid" onClick={(e) => e.stopPropagation()}>
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">{visible[open].caption || "photo"}</span>
              <span className="text-[10px] text-ink-soft">
                {open + 1}/{visible.length}
              </span>
              <button type="button" onClick={() => setOpen(null)} className="ml-2 text-ink-soft hover:text-accent cursor-pointer" aria-label="close">
                ✕
              </button>
            </div>
            <img src={visible[open].url} alt={visible[open].caption} className="max-w-[90vw] max-h-[75vh] object-contain bg-paper-2" />
            <div className="flex justify-between items-center px-3 py-1.5 text-[11px] border-t border-line">
              <button type="button" className="btn text-[11px]" onClick={() => setOpen((open - 1 + visible.length) % visible.length)}>
                ← prev
              </button>
              <span className="text-ink-soft">{visible[open].tag}</span>
              <button type="button" className="btn text-[11px]" onClick={() => setOpen((open + 1) % visible.length)}>
                next →
              </button>
            </div>
          </figure>
        </div>
      )}
    </div>
  );
}
