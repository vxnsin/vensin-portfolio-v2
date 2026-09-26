"use client";

import Link from "next/link";
import { useLanyardContext } from "@/components/discord/LanyardProvider";
import type { NowBox as NowBoxData } from "@/lib/store";

// Minecraft clients show up under their own name in Discord
const MINECRAFT_CLIENTS = /^(labymod|lunar client|badlion client|feather client|minecraft)/i;

function gameLabel(name: string) {
  if (MINECRAFT_CLIENTS.test(name)) return name.toLowerCase().startsWith("minecraft") ? name : `Minecraft (${name})`;
  return name;
}

/** "now" box: falls back to the admin-configured texts, goes live when Discord knows better. */
export function NowBox({ fallback }: { fallback: NowBoxData }) {
  const { data } = useLanyardContext();

  // PreMiD reports "browsing Discord" as a game; that's not playing anything
  const game = data?.activities.find((a) => a.type === 0 && !/^(discord|premid)$/i.test(a.name));
  const watching = data?.activities.find((a) => a.type === 3);
  const spotify = data?.spotify;

  const rows: Array<{ key: string; label: string; value: React.ReactNode; live: boolean }> = [
    {
      key: "watching",
      label: "watching",
      value: watching ? `${watching.details || watching.name}${watching.details ? ` (${watching.name})` : ""}` : <Link href="/anime">{fallback.watching}</Link>,
      live: Boolean(watching),
    },
    { key: "playing", label: "playing", value: game ? gameLabel(game.name) : fallback.playing, live: Boolean(game) },
    { key: "listening", label: "listening", value: spotify ? `${spotify.song} – ${spotify.artist}` : fallback.listening, live: Boolean(spotify) },
    { key: "mood", label: "mood", value: fallback.mood, live: false },
  ];

  return (
    <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      {rows.map((r) => (
        <div key={r.key} className="contents">
          <dt className="text-ink-soft">{r.label}:</dt>
          <dd className="min-w-0 truncate" title={typeof r.value === "string" ? r.value : undefined}>
            {r.value}
            {r.live && (
              <span className="ml-1 text-[9px] align-middle" style={{ color: "var(--ok)" }} title="live from discord">
                ●
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
