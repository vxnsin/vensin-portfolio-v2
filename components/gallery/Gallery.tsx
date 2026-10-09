"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/store";
import { VideoPlayer } from "./VideoPlayer";

export type ItemFolder = { name: string; href: string };

/** what an item is called: its title, else its caption */
const nameOf = (it: GalleryItem) => it.title || it.caption;

function Thumb({ it }: { it: GalleryItem }) {
  if (it.kind === "video") {
    return (
      <div className="relative w-full h-full">
        {it.poster ? (
          <img src={it.poster} alt={nameOf(it) || "video"} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          // no still yet (it gets made in the background): the browser shows the first frame
          <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        )}
        <span className="absolute left-1.5 bottom-1.5 chip text-[10px] bg-paper" aria-hidden>
          ▶ video
        </span>
      </div>
    );
  }
  return <img src={it.url} alt={nameOf(it) || "photo"} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />;
}

type Kind = "all" | "image" | "video";

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
// dates are read straight from the stored text (local time where it was shot), so server and browser print the same
const stamp = (it: GalleryItem) => it.takenAt ?? it.createdAt;
const monthKey = (it: GalleryItem) => stamp(it).slice(0, 7);
const monthLabel = (key: string) => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
function whenLabel(it: GalleryItem) {
  const s = stamp(it);
  const day = `${Number(s.slice(8, 10))} ${MONTHS[Number(s.slice(5, 7)) - 1].slice(0, 3)} ${s.slice(0, 4)}`;
  return it.takenAt ? `${day}, ${s.slice(11, 16)}` : `uploaded ${day}`;
}

/** the photo grid of one folder view, split by month, with a lightbox (arrow keys, esc) and small filters */
export function Gallery({ items, folders, showFolder }: { items: GalleryItem[]; folders: Record<string, ItemFolder>; showFolder: boolean }) {
  const [kind, setKind] = useState<Kind>("all");
  const [oldest, setOldest] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const filtered = kind === "all" ? items : items.filter((i) => i.kind === kind);
  const visible = oldest ? [...filtered].reverse() : filtered;
  const hasBoth = items.some((i) => i.kind === "video") && items.some((i) => i.kind === "image");

  // consecutive runs of the same month, each with the index of its first item in `visible` (for the lightbox)
  const groups: Array<{ key: string; offset: number; items: GalleryItem[] }> = [];
  visible.forEach((it, i) => {
    const key = monthKey(it);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(it);
    else groups.push({ key, offset: i, items: [it] });
  });

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
              {oldest ? "oldest shot first ↑" : "newest shot first ↓"}
            </button>
          )}
        </div>
      )}

      {groups.map((g) => (
        <section key={`${g.key}-${g.offset}`} className="grid gap-2" aria-label={monthLabel(g.key)}>
          {groups.length > 1 && (
            <h3 className="month-rule text-[10px] text-ink-soft">
              <span>{monthLabel(g.key)}</span>
              <span>{g.items.length}</span>
            </h3>
          )}
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {g.items.map((it, k) => {
              const i = g.offset + k;
              const f = showFolder ? where(it) : undefined;
              return (
                <li key={it.id} className="min-w-0">
                  <button type="button" onClick={() => setOpen(i)} className="block w-full text-left group cursor-pointer" title={whenLabel(it)}>
                    <div className="aspect-square border border-line bg-paper-2 overflow-hidden">
                      <Thumb it={it} />
                    </div>
                    {(nameOf(it) || f) && (
                      <div className="mt-1 text-[11px] truncate">
                        {nameOf(it) && <span className="group-hover:text-accent">{nameOf(it)}</span>}
                        {f && (
                          <span className="text-ink-soft">
                            {nameOf(it) ? " · " : ""}
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
        </section>
      ))}

      {current && open !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(0,0,0,.75)" }} onClick={() => setOpen(null)} role="dialog" aria-modal aria-label={nameOf(current) || current.kind}>
          <figure className="win max-w-[92vw] max-h-[94vh] grid" onClick={(e) => e.stopPropagation()}>
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">{nameOf(current) || (current.kind === "video" ? "video" : "photo")}</span>
              <span className="text-[10px] text-ink-soft">
                {open + 1}/{visible.length}
              </span>
              <button type="button" onClick={() => setOpen(null)} className="ml-2 text-ink-soft hover:text-accent cursor-pointer" aria-label="close">
                ✕
              </button>
            </div>
            {current.kind === "video" ? (
              <VideoPlayer
                key={current.id}
                src={current.webUrl ?? current.url}
                original={current.url}
                poster={current.poster}
                converting={current.webStatus === "pending" || current.webStatus === "working"}
                label={nameOf(current) || "video"}
              />
            ) : (
              <img src={current.url} alt={nameOf(current) || "photo"} className="max-w-[90vw] max-h-[72vh] object-contain bg-paper-2 mx-auto" />
            )}
            {current.title && current.caption && <p className="px-3 pt-2 text-[11px] text-ink-soft max-w-[min(90vw,720px)] whitespace-pre-line">{current.caption}</p>}
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
                {whenLabel(current)}
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
