"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useEffect, useRef, useState } from "react";
import { addFavoriteAction, type ActionState } from "../actions";
import type { KitsuHit } from "@/lib/kitsu";

export function AddFavorite() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<KitsuHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<KitsuHit | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await addFavoriteAction(prev, fd);
    if (result?.ok) {
      setPicked(null);
      setQuery("");
      setHits([]);
    }
    return result;
  }, null);

  const showHits = !picked && query.trim().length >= 2 && hits.length > 0;

  // debounced live search against kitsu
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2 || picked) return;
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/kitsu/search?q=${encodeURIComponent(query.trim())}`);
        setHits(res.ok ? await res.json() : []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, picked]);

  return (
    <form action={action} className="grid gap-3 text-xs">
      <label className="grid gap-1 relative">
        <span className="text-ink-soft">search kitsu</span>
        <input
          value={picked ? picked.title : query}
          onChange={(e) => {
            setPicked(null);
            setQuery(e.target.value);
          }}
          placeholder="type a title… e.g. frieren"
          className="input"
          autoComplete="off"
        />
        {searching && <span className="absolute right-2 top-7 text-[10px] text-ink-soft">searching…</span>}
        {showHits && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto border border-line bg-paper shadow-[var(--shadow)]">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => setPicked(h)}
                  className="w-full flex gap-2 items-center p-1.5 text-left hover:bg-accent-soft cursor-pointer border-b border-dashed border-line last:border-0"
                >
                  <span className="w-8 aspect-[2/3] bg-paper-2 border border-line overflow-hidden shrink-0">
                    {h.posterSmall && <img src={h.posterSmall} alt="" className="w-full h-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{h.title}</span>
                    <span className="block text-[10px] text-ink-soft">
                      {h.year ?? "?"} {h.rating ? `· ★ ${h.rating.toFixed(1)}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>

      {picked && (
        <div className="flex gap-3 items-start">
          <div className="w-14 aspect-[2/3] border border-line bg-paper-2 overflow-hidden shrink-0">{picked.poster && <img src={picked.poster} alt="" className="w-full h-full object-cover" />}</div>
          <div className="text-[11px] text-ink-soft min-w-0">
            <div className="text-ink pixel text-sm truncate">{picked.title}</div>
            <div>
              {picked.year ?? "?"} {picked.rating ? `· community ★ ${picked.rating.toFixed(1)}` : ""}
            </div>
            {picked.synopsis && <div className="mt-1 line-clamp-3">{picked.synopsis}…</div>}
          </div>
        </div>
      )}

      <input type="hidden" name="kitsuId" value={picked?.id ?? ""} />
      <input type="hidden" name="title" value={picked?.title ?? ""} />
      <input type="hidden" name="slug" value={picked?.slug ?? ""} />
      <input type="hidden" name="poster" value={picked?.poster ?? ""} />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1">
          <span className="text-ink-soft">your note (short)</span>
          <input name="note" maxLength={80} className="input" placeholder="el psy kongroo" />
        </label>
        <label className="grid gap-1">
          <span className="text-ink-soft">your rating</span>
          <select name="rating" defaultValue={9} className="input">
            {Array.from({ length: 10 }, (_, n) => 10 - n).map((n) => (
              <option key={n} value={n}>
                {n}/10
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending || !picked} className="btn disabled:opacity-50">
          {pending ? "adding…" : "add →"}
        </button>
      </div>

      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>added ✓</p>}
    </form>
  );
}
