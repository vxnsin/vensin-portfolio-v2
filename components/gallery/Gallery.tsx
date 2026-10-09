"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/store";

export type ItemFolder = { name: string; href: string };

function Thumb({ it }: { it: GalleryItem }) {
  if (it.kind === "video") {
    return (
      <div className="relative w-full h-full">
        <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        <span className="absolute left-1.5 bottom-1.5 chip text-[10px] bg-paper" aria-hidden>
          ▶ video
        </span>
      </div>
    );
  }
  return <img src={it.url} alt={it.caption || "photo"} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />;
}

type Kind = "all" | "image" | "video";

/** the photo grid of one folder view, with a lightbox (arrow keys, esc) and small filters */
export function Gallery({ items, folders, showFolder }: { items: GalleryItem[]; folders: Record<string, ItemFolder>; showFolder: boolean }) {
  const [kind, setKind] = useState<Kind>("all");
  const [oldest, setOldest] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const filtered = kind === "all" ? items : items.filter((i) => i.kind === kind);
  const visible = oldest ? [...filtered].reverse() : filtered;
  const hasBoth = items.some((i) => i.kind === "video") && items.some((i) => i.kind === "image");

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

  if (items.length === 0) return <p className="text-xs text-ink-soft border border-dashed border-line p-4 text-center">nothing in here yet. soon™</p>;

  const current = open !== null ? visible[open] : null;
  const where = (it: GalleryItem) => (it.folderId ? folders[it.folderId] : undefined);
  const here = current ? where(current) : undefined;

  return (
    <div className="grid gap-3">
      {(hasBoth || items.length > 1) && (
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {hasBoth &&
            (["all", "image", "video"] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setOpen(null);
                }}
                className="chip cursor-pointer hover:bg-accent-soft"
                style={kind === k ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
              >
                {k === "all" ? "everything" : k === "image" ? "photos" : "videos"}
              </button>
            ))}
          {items.length > 1 && (
            <button type="button" onClick={() => setOldest((o) => !o)} className="chip cursor-pointer hover:bg-accent-soft ml-auto">
              {oldest ? "oldest first ↑" : "newest first ↓"}
            </button>
          )}
        </div>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {visible.map((it, i) => {
          const f = showFolder ? where(it) : undefined;
          return (
            <li key={it.id} className="min-w-0">
              <button type="button" onClick={() => setOpen(i)} className="block w-full text-left group cursor-pointer">
                <div className="aspect-square border border-line bg-paper-2 overflow-hidden">
                  <Thumb it={it} />
                </div>
                {(it.caption || f) && (
                  <div className="mt-1 text-[11px] truncate">
                    {it.caption && <span className="group-hover:text-accent">{it.caption}</span>}
                    {f && (
                      <span className="text-ink-soft">
                        {it.caption ? " · " : ""}
                        {f.name}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {current && open !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(0,0,0,.75)" }} onClick={() => setOpen(null)} role="dialog" aria-modal aria-label={current.caption || "photo"}>
          <figure className="win max-w-[92vw] max-h-[90vh] grid" onClick={(e) => e.stopPropagation()}>
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">{current.caption || (current.kind === "video" ? "video" : "photo")}</span>
              <span className="text-[10px] text-ink-soft">
                {open + 1}/{visible.length}
              </span>
              <button type="button" onClick={() => setOpen(null)} className="ml-2 text-ink-soft hover:text-accent cursor-pointer" aria-label="close">
                ✕
              </button>
            </div>
            {current.kind === "video" ? (
              <video key={current.id} src={current.url} controls autoPlay playsInline className="max-w-[90vw] max-h-[75vh] bg-black" />
            ) : (
              <img src={current.url} alt={current.caption || "photo"} className="max-w-[90vw] max-h-[75vh] object-contain bg-paper-2" />
            )}
            <div className="flex justify-between items-center gap-2 px-3 py-1.5 text-[11px] border-t border-line">
              <button type="button" className="btn text-[11px]" onClick={() => setOpen((open - 1 + visible.length) % visible.length)}>
                ← prev
              </button>
              <span className="text-ink-soft truncate">
                {here && (
                  <>
                    in{" "}
                    <Link href={here.href} onClick={() => setOpen(null)} className="hover:text-accent">
                      {here.name}
                    </Link>
                    {" · "}
                  </>
                )}
                {new Date(current.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
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
