"use client";

import { useEffect, useMemo, useState } from "react";
import type { NowPlaying } from "@/lib/spotify";

type Line = { t: number; text: string };
type Payload = { id: string; synced: Line[] | null; plain: string | null; instrumental: boolean };

const CHAR_MS = 38; // typewriter speed for the current line

/** the current lyric line, typed out in time with the track; the line before and after sit dimmed around it */
export function Lyrics({ now }: { now: NowPlaying | null }) {
  const track = now?.playing ? now.track : null;
  const trackId = track?.id ?? null;
  const [data, setData] = useState<Payload | null>(null);
  const [ms, setMs] = useState(0);

  // fetch once per track
  useEffect(() => {
    if (!trackId) return;
    let alive = true;
    fetch(`/api/lyrics?id=${encodeURIComponent(trackId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Payload | null) => {
        if (alive) setData(j && j.id === trackId ? j : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [trackId]);

  // a finer clock than the progress bar needs, so letters appear smoothly
  useEffect(() => {
    if (!track || !now) return;
    const base = new Date(now.fetchedAt).getTime();
    const id = setInterval(() => setMs(now.progressMs + (Date.now() - base)), 80);
    return () => clearInterval(id);
  }, [now, track]);

  const lines = useMemo(() => data?.synced?.filter((l) => l.text.length > 0) ?? null, [data]);
  if (!track) return null;
  if (!data || data.id !== trackId) return <p className="text-[11px] text-ink-soft mt-3">looking for lyrics…</p>;
  if (data.instrumental) return <p className="text-[11px] text-ink-soft mt-3">instrumental. just vibes.</p>;
  if (!lines || lines.length === 0) return <p className="text-[11px] text-ink-soft mt-3">no synced lyrics for this one.</p>;

  let idx = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].t <= ms) idx = i;
  const cur = idx >= 0 ? lines[idx] : null;
  const prev = idx > 0 ? lines[idx - 1] : null;
  const next = idx + 1 < lines.length ? lines[idx + 1] : null;
  const typed = cur ? cur.text.slice(0, Math.max(0, Math.floor((ms - cur.t) / CHAR_MS))) : "";
  const done = cur ? typed.length >= cur.text.length : false;

  return (
    <div className="mt-3 border-t border-dashed border-line pt-2 text-xs leading-relaxed min-h-[4.5rem]" aria-live="polite">
      <div className="text-ink-soft/60 truncate">{prev?.text ?? (cur ? "" : "♪")}</div>
      <div className="pixel text-base text-ink">
        {cur ? typed : "…"}
        {cur && !done && <span className="text-accent">▌</span>}
      </div>
      <div className="text-ink-soft/60 truncate">{next?.text ?? ""}</div>
    </div>
  );
}
