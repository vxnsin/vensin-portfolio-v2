"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useLanyardContext } from "@/components/discord/LanyardProvider";
import { resolveAll } from "@/components/discord/activities";
import { relativeTime } from "@/lib/time";

type Last = { song: string; artist: string; art: string | null; trackId: string | null; at: string } | null;

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Big "now playing" card: live from Discord/Lanyard, otherwise the last logged track. */
export function NowPlaying({ last }: { last: Last }) {
  const { data } = useLanyardContext();
  const now = useNow();
  const live = data ? resolveAll(data.activities).find((r) => r.handler.id === "spotify")?.info : null;

  if (live) {
    const p = live.progress;
    const pct = p ? Math.min(100, ((now - p.start) / (p.end - p.start)) * 100) : 0;
    return (
      <div className="flex gap-4 items-center">
        <div className="relative shrink-0">
          {live.image ? <img src={live.image} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-cover border-2 border-line" /> : <div className="w-24 h-24 border border-dashed border-line" />}
          <span className="absolute bottom-1 right-1 eq" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wide text-ink-soft">♪ playing right now</div>
          <div className="pixel text-xl leading-tight truncate mt-1">
            {live.href ? (
              <a href={live.href} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-accent">
                {live.title}
              </a>
            ) : (
              live.title
            )}
          </div>
          <div className="text-sm text-ink-soft truncate">{live.sub}</div>
          <div className="text-xs text-ink-soft truncate">{live.sub2}</div>
          {p && (
            <div className="mt-2">
              <div className="progress">
                <i style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-ink-soft mt-0.5">
                <span>{fmt(now - p.start)}</span>
                <span>{fmt(p.end - p.start)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (last) {
    return (
      <div className="flex gap-4 items-center">
        {last.art ? <img src={last.art} alt="" className="w-20 h-20 object-cover border-2 border-line opacity-80" /> : <div className="w-20 h-20 border border-dashed border-line" />}
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-ink-soft">nothing playing · last heard {relativeTime(last.at)}</div>
          <div className="pixel text-lg truncate mt-1">
            {last.trackId ? (
              <a href={`https://open.spotify.com/track/${last.trackId}`} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-accent">
                {last.song}
              </a>
            ) : (
              last.song
            )}
          </div>
          <div className="text-sm text-ink-soft truncate">{last.artist}</div>
        </div>
      </div>
    );
  }

  return <p className="text-xs text-ink-soft">nothing playing, nothing logged yet. give it a day.</p>;
}
