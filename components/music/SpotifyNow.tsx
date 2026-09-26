"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { NowPlaying } from "@/lib/spotify";
import { relativeTime } from "@/lib/time";

type Last = { song: string; artist: string; art: string | null; trackId: string | null; at: string } | null;

const POLL_MS = 15_000;
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Now playing straight from the Spotify API. Polls /api/spotify/now and interpolates the progress bar in between. */
export function SpotifyNow({ initial, last, variant = "sidebar" }: { initial: NowPlaying | null; last?: Last; variant?: "sidebar" | "hero" }) {
  const [now, setNow] = useState<NowPlaying | null>(initial);
  // starts at the snapshot time so server and client render the same elapsed value; the clock takes over after mount
  const [tick, setTick] = useState(() => (initial ? new Date(initial.fetchedAt).getTime() : 0));

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/spotify/now", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (alive && j.connected) setNow(j as NowPlaying);
      } catch {}
    };
    const poll = setInterval(load, POLL_MS);
    const clock = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  const track = now?.playing ? now.track : null;
  const elapsed = track && now ? Math.min(track.durationMs, now.progressMs + (tick - new Date(now.fetchedAt).getTime())) : 0;
  const pct = track ? (elapsed / track.durationMs) * 100 : 0;
  const hero = variant === "hero";

  if (track) {
    return (
      <div className={`flex items-center ${hero ? "gap-4" : "gap-3"}`}>
        <div className="relative shrink-0">
          {track.art ? (
            <img src={track.art} alt="" className={`${hero ? "w-24 h-24 sm:w-28 sm:h-28 border-2" : "w-14 h-14 border"} object-cover border-line`} />
          ) : (
            <div className={`${hero ? "w-24 h-24" : "w-14 h-14"} border border-dashed border-line`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {hero && <div className="text-[11px] uppercase tracking-wide text-ink-soft">♪ playing right now{now?.device ? ` · ${now.device}` : ""}</div>}
          <div className={`${hero ? "pixel text-xl mt-1" : "text-xs font-semibold"} leading-tight truncate`}>
            <a href={track.url} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-accent">
              {track.name}
            </a>
          </div>
          <div className={`${hero ? "text-sm" : "text-[11px]"} text-ink-soft truncate`}>by {track.artists.join(", ")}</div>
          {hero && <div className="text-xs text-ink-soft truncate">on {track.album}</div>}
          <div className={hero ? "mt-2" : "mt-1"}>
            <div className="progress">
              <i style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-ink-soft mt-0.5">
              <span>{fmt(elapsed)}</span>
              <span>{fmt(track.durationMs)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (last) {
    return (
      <div className={`flex items-center ${hero ? "gap-4" : "gap-3"}`}>
        {last.art ? <img src={last.art} alt="" className={`${hero ? "w-20 h-20 border-2" : "w-12 h-12 border"} object-cover border-line opacity-80`} /> : <div className="w-12 h-12 border border-dashed border-line" />}
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-ink-soft">paused · last heard {relativeTime(last.at)}</div>
          <div className={`${hero ? "pixel text-lg mt-1" : "text-xs font-semibold"} truncate`}>
            {last.trackId ? (
              <a href={`https://open.spotify.com/track/${last.trackId}`} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-accent">
                {last.song}
              </a>
            ) : (
              last.song
            )}
          </div>
          <div className={`${hero ? "text-sm" : "text-[11px]"} text-ink-soft truncate`}>{last.artist}</div>
        </div>
      </div>
    );
  }

  return <p className="text-xs text-ink-soft">spotify is quiet right now.</p>;
}
