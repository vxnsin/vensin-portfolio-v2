"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { useLanyard } from "./useLanyard";
import type { Activity, LanyardData } from "./schemas";

const STATUS: Record<LanyardData["discord_status"], { label: string; color: string }> = {
  online: { label: "online", color: "var(--ok)" },
  idle: { label: "idle", color: "var(--idle)" },
  dnd: { label: "do not disturb", color: "var(--dnd)" },
  offline: { label: "offline", color: "var(--off)" },
};

function avatarUrl(user: LanyardData["discord_user"]) {
  if (!user.avatar) return "https://cdn.discordapp.com/embed/avatars/0.png";
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
}

function assetUrl(a: Activity): string | null {
  const img = a.assets?.large_image;
  if (!img) return null;
  if (img.startsWith("mp:external/")) return `https://media.discordapp.net/external/${img.slice("mp:external/".length)}`;
  if (img.startsWith("mp:")) return `https://media.discordapp.net/${img.slice(3)}`;
  if (img.startsWith("spotify:")) return `https://i.scdn.co/image/${img.slice(8)}`;
  if (a.application_id) return `https://cdn.discordapp.com/app-assets/${a.application_id}/${img}.png`;
  return null;
}

function emojiUrl(e: NonNullable<Activity["emoji"]>) {
  if (!e.id) return null;
  return `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "png"}?size=32`;
}

function useNow(tick = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tick);
    return () => clearInterval(id);
  }, [tick]);
  return now;
}

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
}

function verb(a: Activity) {
  switch (a.type) {
    case 0:
      return "playing";
    case 1:
      return "streaming";
    case 2:
      return "listening to";
    case 3:
      return "watching";
    case 5:
      return "competing in";
    default:
      return "doing";
  }
}

function Row({ icon, title, sub, sub2, footer }: { icon?: string | null; title: string; sub?: string | null; sub2?: string | null; footer?: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2">
      {icon ? (
        <img src={icon} alt="" width={44} height={44} className="w-11 h-11 object-cover border border-line shrink-0" />
      ) : (
        <div className="w-11 h-11 border border-dashed border-line shrink-0 grid place-items-center text-ink-soft">?</div>
      )}
      <div className="min-w-0 flex-1 text-xs leading-snug">
        <div className="font-semibold truncate text-ink">{title}</div>
        {sub && <div className="truncate text-ink-soft">{sub}</div>}
        {sub2 && <div className="truncate text-ink-soft">{sub2}</div>}
        {footer}
      </div>
    </div>
  );
}

function Spotify({ s }: { s: NonNullable<LanyardData["spotify"]> }) {
  const now = useNow();
  const start = s.timestamps?.start ?? 0;
  const end = s.timestamps?.end ?? 0;
  const pct = end > start ? Math.min(100, ((now - start) / (end - start)) * 100) : 0;
  const title = s.track_id ? (
    <a href={`https://open.spotify.com/track/${s.track_id}`} target="_blank" rel="noreferrer" className="no-underline hover:underline">
      {s.song}
    </a>
  ) : (
    s.song
  );
  return (
    <div>
      <div className="text-[11px] text-ink-soft uppercase tracking-wide">♪ listening on spotify</div>
      <Row
        icon={s.album_art_url ?? null}
        title={s.song}
        sub={`by ${s.artist}`}
        sub2={s.album ? `on ${s.album}` : null}
        footer={
          end > start ? (
            <div className="mt-1">
              <div className="progress">
                <i style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-ink-soft mt-0.5">
                <span>{fmt(now - start)}</span>
                <span>{fmt(end - start)}</span>
              </div>
            </div>
          ) : null
        }
      />
      <span className="sr-only">{title}</span>
    </div>
  );
}

function Generic({ a }: { a: Activity }) {
  const now = useNow();
  const start = a.timestamps?.start;
  return (
    <div>
      <div className="text-[11px] text-ink-soft uppercase tracking-wide">
        {verb(a)} {a.name}
      </div>
      <Row
        icon={assetUrl(a)}
        title={a.details || a.name}
        sub={a.state ?? null}
        sub2={a.assets?.large_text ?? null}
        footer={start ? <div className="text-[10px] text-ink-soft mt-0.5">⏱ {fmt(now - start)} elapsed</div> : null}
      />
    </div>
  );
}

function CustomStatus({ a }: { a: Activity }) {
  const e = a.emoji;
  const url = e ? emojiUrl(e) : null;
  return (
    <div className="flex items-center gap-2 text-xs py-1 min-w-0">
      {url ? <img src={url} alt="" width={18} height={18} className="w-[18px] h-[18px] shrink-0" /> : e?.name ? <span className="shrink-0">{e.name}</span> : null}
      <span className="truncate min-w-0" title={a.state ?? ""}>{a.state ?? ""}</span>
    </div>
  );
}

export function DiscordPresence() {
  const { data, live } = useLanyard(site.discordUserId);

  if (!data) {
    return (
      <div className="text-xs text-ink-soft py-2">
        connecting to discord<span className="blink">…</span>
      </div>
    );
  }

  const status = STATUS[data.discord_status];
  const name = data.discord_user.display_name || data.discord_user.global_name || data.discord_user.username;
  const custom = data.activities.find((a) => a.type === 4);
  const others = data.activities.filter((a) => a.type !== 4 && a.name !== "Spotify");

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={avatarUrl(data.discord_user)} alt="" width={48} height={48} className="w-12 h-12 border border-line" />
          <span className="status-dot absolute -bottom-1 -right-1" style={{ background: status.color }} title={status.label} />
        </div>
        <div className="min-w-0">
          <div className="pixel truncate">{name}</div>
          <div className="text-xs text-ink-soft">
            @{data.discord_user.username} · <span style={{ color: status.color }}>{status.label}</span>
            {live && <span title="live via websocket"> ●</span>}
          </div>
        </div>
      </div>

      {custom && <CustomStatus a={custom} />}

      {(data.spotify || others.length > 0) && <hr className="dotted-hr" />}

      {data.spotify && <Spotify s={data.spotify} />}
      {others.map((a) => (
        <Generic key={a.id ?? a.name} a={a} />
      ))}

      {!data.spotify && others.length === 0 && !custom && (
        <div className="text-xs text-ink-soft mt-2">
          {data.discord_status === "offline" ? "probably sleeping or touching grass" : "not doing anything special right now"} (￣o￣) zzZ
        </div>
      )}
    </div>
  );
}
