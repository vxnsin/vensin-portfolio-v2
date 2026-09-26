"use client";

import { useLanyardContext } from "@/components/discord/LanyardProvider";
import { isGame, watchingInfo } from "@/components/discord/detect";
import type { Latest } from "@/lib/store";

// Minecraft clients show up under their own name in Discord
const MINECRAFT_CLIENTS = /^(labymod|lunar client|badlion client|feather client)/i;

function gameLabel(name: string) {
  return MINECRAFT_CLIENTS.test(name) ? `Minecraft (${name})` : name;
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`;
}

type Row = { label: string; value: string; live: boolean; at?: string; href?: string };

/** what's running right now, otherwise the last thing that was. */
export function LatestBox({ latest }: { latest: Latest }) {
  const { data } = useLanyardContext();

  const game = data?.activities.find(isGame);
  const watching = data?.activities.find((a) => a.type === 3);
  const spotify = data?.spotify;

  const rows: Row[] = [];

  if (game) rows.push({ label: "playing", value: gameLabel(game.name), live: true });
  else if (latest.playing) rows.push({ label: "played", value: gameLabel(latest.playing.name), live: false, at: latest.playing.at });

  if (watching) {
    const info = watchingInfo(watching);
    rows.push({ label: "watching", value: `${info.title} · ${info.service}`, live: true });
  }
  else if (latest.watching) rows.push({ label: "watched", value: `${latest.watching.title} · ${latest.watching.service}`, live: false, at: latest.watching.at });

  if (spotify) rows.push({ label: "listening", value: `${spotify.song} – ${spotify.artist}`, live: true, href: spotify.track_id ? `https://open.spotify.com/track/${spotify.track_id}` : undefined });
  else if (latest.listening)
    rows.push({
      label: "listened",
      value: `${latest.listening.song} – ${latest.listening.artist}`,
      live: false,
      at: latest.listening.at,
      href: latest.listening.trackId ? `https://open.spotify.com/track/${latest.listening.trackId}` : undefined,
    });

  if (rows.length === 0) return <p className="text-xs text-ink-soft">nothing recorded yet. give it a moment.</p>;

  return (
    <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="contents">
          <dt className="text-ink-soft">{r.label}:</dt>
          <dd className="min-w-0">
            <div className="truncate" title={r.value}>
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
              {r.live && (
                <span className="ml-1 text-[9px] align-middle" style={{ color: "var(--ok)" }} title="live from discord">
                  ●
                </span>
              )}
            </div>
            {!r.live && r.at && <div className="text-[10px] text-ink-soft">{ago(r.at)}</div>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
