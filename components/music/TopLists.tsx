"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { Artist, Range, Track } from "@/lib/spotify";
import type { LogTrack } from "@/lib/listens";

type RangeKey = Range | "year";
const RANGES: Array<{ key: RangeKey; label: string; hint: string }> = [
  { key: "short", label: "4 weeks", hint: "spotify" },
  { key: "medium", label: "6 months", hint: "spotify" },
  { key: "long", label: "lifetime", hint: "spotify" },
  { key: "year", label: "this year", hint: "logged by this site" },
];

export type LogArtistView = { artist: string; minutes: number; image: string | null };

const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

function Row({ n, art, round, title, sub, right, href }: { n: number; art: string | null; round?: boolean; title: string; sub?: string | null; right?: string; href?: string | null }) {
  const inner = (
    <>
      <span className="pixel text-accent-2 w-5 text-right shrink-0">{n}</span>
      <span className={`w-10 h-10 shrink-0 overflow-hidden border border-line bg-paper-2 ${round ? "rounded-full" : ""}`}>{art && <img src={art} alt={title} className="w-full h-full object-cover" loading="lazy" decoding="async" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-ink group-hover:text-accent">{title}</span>
        {sub && <span className="block truncate text-ink-soft text-[11px]">{sub}</span>}
      </span>
      {right && <span className="text-[11px] text-ink-soft shrink-0">{right}</span>}
    </>
  );
  const cls = "flex items-center gap-3 py-1.5 border-b border-dashed border-line last:border-0 no-underline group min-w-0";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function TopLists({
  spotifyTracks,
  spotifyArtists,
  logTracks,
  logArtists,
}: {
  spotifyTracks: Record<Range, Track[]> | null;
  spotifyArtists: Record<Range, Artist[]> | null;
  logTracks: LogTrack[];
  logArtists: LogArtistView[];
}) {
  const ranges = spotifyTracks ? RANGES : RANGES.filter((r) => r.key === "year");
  const [range, setRange] = useState<RangeKey>(spotifyTracks ? "medium" : "year");
  const current = ranges.find((r) => r.key === range) ?? ranges[0];

  const tracks = range === "year" ? null : (spotifyTracks?.[range] ?? []).slice(0, 5);
  const artists = range === "year" ? null : (spotifyArtists?.[range] ?? []).slice(0, 5);

  return (
    <div className="grid gap-3 text-xs min-w-0">
      {ranges.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {ranges.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className="chip cursor-pointer hover:bg-accent-soft"
              style={range === r.key ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
              title={r.hint}
            >
              {r.label}
            </button>
          ))}
          <span className="text-[10px] text-ink-soft ml-1">{current.hint}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 min-w-0">
        <div className="min-w-0">
          <div className="pixel text-ink-soft mb-1">top tracks</div>
          {range === "year" ? (
            logTracks.length ? (
              logTracks.slice(0, 5).map((t, i) => <Row key={`${t.trackId}-${i}`} n={i + 1} art={t.art} title={t.song} sub={t.artist} right={`${t.minutes} min`} href={t.trackId ? `https://open.spotify.com/track/${t.trackId}` : null} />)
            ) : (
              <p className="text-ink-soft">nothing logged yet.</p>
            )
          ) : tracks && tracks.length ? (
            tracks.map((t, i) => <Row key={t.id} n={i + 1} art={t.art} title={t.name} sub={t.artists.join(", ")} right={fmt(t.durationMs)} href={t.url} />)
          ) : (
            <p className="text-ink-soft">no data for this range yet.</p>
          )}
        </div>
        <div className="min-w-0">
          <div className="pixel text-ink-soft mb-1">top artists</div>
          {range === "year" ? (
            logArtists.length ? (
              logArtists.slice(0, 5).map((a, i) => <Row key={a.artist} n={i + 1} art={a.image} round title={a.artist} right={`${a.minutes} min`} />)
            ) : (
              <p className="text-ink-soft">nothing logged yet.</p>
            )
          ) : artists && artists.length ? (
            artists.map((a, i) => <Row key={a.id} n={i + 1} art={a.image} round title={a.name} sub={a.genres[0] ?? null} href={a.url} />)
          ) : (
            <p className="text-ink-soft">no data for this range yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
