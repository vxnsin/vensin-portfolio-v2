"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { Range, Track } from "@/lib/spotify";
import type { LogTrack } from "@/lib/listens";

const RANGE_LABEL: Record<Range, string> = { short: "4 weeks", medium: "6 months", long: "all time" };
const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

function Row({ n, art, title, sub, right, href }: { n: number; art: string | null; title: string; sub: string; right: string; href?: string | null }) {
  const inner = (
    <>
      <span className="pixel text-accent-2 w-6 text-right shrink-0">{n}</span>
      {art ? <img src={art} alt="" className="w-10 h-10 object-cover border border-line shrink-0" loading="lazy" /> : <span className="w-10 h-10 border border-dashed border-line shrink-0" />}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ink group-hover:text-accent">{title}</span>
        <span className="block truncate text-ink-soft text-[11px]">{sub}</span>
      </span>
      <span className="text-[11px] text-ink-soft shrink-0">{right}</span>
    </>
  );
  const cls = "flex items-center gap-3 py-1.5 border-b border-dashed border-line last:border-0 no-underline group";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function TopTracks({ spotify, log }: { spotify: Record<Range, Track[]> | null; log: LogTrack[] }) {
  const [range, setRange] = useState<Range>("short");
  const tabs: Array<{ key: Range | "log"; label: string }> = [
    ...(spotify ? (Object.keys(RANGE_LABEL) as Range[]).map((k) => ({ key: k, label: RANGE_LABEL[k] })) : []),
    { key: "log" as const, label: "logged here" },
  ];
  const [tab, setTab] = useState<Range | "log">(spotify ? "short" : "log");

  const list = tab === "log" ? null : spotify?.[tab] ?? null;

  return (
    <div className="grid gap-2 text-xs">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              if (t.key !== "log") setRange(t.key);
            }}
            className="chip cursor-pointer hover:bg-accent-soft"
            style={tab === t.key ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "log" ? (
        log.length === 0 ? (
          <p className="text-ink-soft">nothing logged yet.</p>
        ) : (
          <div>
            {log.map((t, i) => (
              <Row key={`${t.trackId}-${i}`} n={i + 1} art={t.art} title={t.song} sub={t.artist} right={`${t.minutes} min`} href={t.trackId ? `https://open.spotify.com/track/${t.trackId}` : null} />
            ))}
          </div>
        )
      ) : list && list.length > 0 ? (
        <div>
          {list.map((t, i) => (
            <Row key={t.id} n={i + 1} art={t.art} title={t.name} sub={t.artists.join(", ")} right={fmt(t.durationMs)} href={t.url} />
          ))}
        </div>
      ) : (
        <p className="text-ink-soft">no data for {RANGE_LABEL[range]} yet.</p>
      )}
    </div>
  );
}
