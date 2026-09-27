"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanyardContext } from "@/components/discord/LanyardProvider";
import type { NowPlaying } from "@/lib/spotify";
import { relativeTime } from "@/lib/time";
import { Lyrics } from "./Lyrics";

type Last = { song: string; artist: string; art: string | null; trackId: string | null; at: string } | null;

const POLL_MS = 15_000;
const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Now playing straight from the Spotify API. Listens to /api/spotify/stream (server-sent events) and interpolates the
 * progress bar in between; polls instead where the stream is unavailable. Asks for a fresh look the moment the track
 * should have ended and whenever discord reports a different track, so changes show up within a second or two.
 */
export function SpotifyNow({ initial, last, variant = "sidebar" }: { initial: NowPlaying | null; last?: Last; variant?: "sidebar" | "hero" }) {
  const [now, setNow] = useState<NowPlaying | null>(initial);
  // starts at the snapshot time so server and client render the same elapsed value; the clock takes over after mount
  const [tick, setTick] = useState(() => (initial ? new Date(initial.fetchedAt).getTime() : 0));
  const { data: lanyard } = useLanyardContext();
  const lanyardTrack = lanyard?.spotify?.track_id ?? null;
  const alive = useRef(true);

  const load = useCallback(async (fresh = false) => {
    try {
      const res = await fetch(fresh ? "/api/spotify/now?fresh=1" : "/api/spotify/now", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      if (alive.current && j.connected) setNow(j as NowPlaying);
    } catch {}
  }, []);

  useEffect(() => {
    alive.current = true;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (!poll) poll = setInterval(() => load(), POLL_MS);
    };
    const stopPolling = () => {
      if (poll) clearInterval(poll);
      poll = null;
    };
    if (typeof EventSource !== "undefined") {
      es = new EventSource("/api/spotify/stream");
      es.addEventListener("now", (e) => {
        if (!alive.current) return;
        try {
          setNow(JSON.parse((e as MessageEvent).data) as NowPlaying);
          stopPolling(); // the stream is back, no need to poll
        } catch {}
      });
      // no long-lived server (or a hiccup): poll until the stream delivers again; EventSource keeps reconnecting on its own
      es.onerror = startPolling;
    } else {
      startPolling();
    }
    const clock = setInterval(() => setTick(Date.now()), 1000);
    return () => {
      alive.current = false;
      es?.close();
      stopPolling();
      clearInterval(clock);
    };
  }, [load]);

  // the track should be over: look again right away (the server itself never polls more often than every few seconds)
  useEffect(() => {
    if (!now?.playing || !now.track) return;
    const endsAt = new Date(now.fetchedAt).getTime() + (now.track.durationMs - now.progressMs);
    const wait = endsAt - Date.now() < -3_000 ? 3_000 : Math.max(500, endsAt - Date.now() + 800);
    const t = setTimeout(() => load(true), wait);
    return () => clearTimeout(t);
  }, [now, load]);

  // discord already knows about a new track: ask spotify right now instead of waiting for the next poll
  const currentId = now?.playing ? (now.track?.id ?? null) : null;
  useEffect(() => {
    if (!lanyardTrack || lanyardTrack === currentId) return;
    const t = setTimeout(() => load(true), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanyardTrack, load]);

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
          {hero && <Lyrics now={now} />}
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
