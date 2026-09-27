"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { useLanyardContext } from "./LanyardProvider";
import { resolveAll, type ActivityInfo } from "./activities";
import type { Activity, LanyardData } from "./schemas";

const STATUS: Record<LanyardData["discord_status"], { label: string; color: string }> = {
  online: { label: "online", color: "var(--ok)" },
  idle: { label: "idle", color: "var(--idle)" },
  dnd: { label: "do not disturb", color: "var(--dnd)" },
  offline: { label: "offline", color: "var(--off)" },
};

/* ---------- helpers ---------- */

function avatarUrl(user: LanyardData["discord_user"]) {
  if (!user.avatar) return "https://cdn.discordapp.com/embed/avatars/0.png";
  const ext = user.avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
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

/* ---------- building blocks ---------- */

/** Progress bar driven by start/end timestamps. Freezes when paused. */
function Progress({ start, end, paused }: { start: number; end: number; paused?: boolean }) {
  const now = useNow();
  const total = end - start;
  const elapsed = Math.min(total, Math.max(0, now - start));
  const pct = total > 0 ? (elapsed / total) * 100 : 0;
  return (
    <div className="mt-1">
      <div className="progress">
        <i style={{ width: `${pct}%`, opacity: paused ? 0.5 : 1 }} />
      </div>
      <div className="flex justify-between text-[10px] text-ink-soft mt-0.5">
        <span>{fmt(elapsed)}</span>
        <span>{paused ? "⏸ paused" : fmt(total)}</span>
      </div>
    </div>
  );
}

function Elapsed({ start }: { start: number }) {
  const now = useNow();
  return <div className="text-[10px] text-ink-soft mt-0.5">⏱ {fmt(now - start)} elapsed</div>;
}

function Line({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <div className="truncate text-ink-soft" title={text}>
      {text}
    </div>
  );
}

/** one activity, rendered purely from its ActivityInfo */
function ActivityCard({ info }: { info: ActivityInfo }) {
  let footer: ReactNode = null;
  if (info.progress) footer = <Progress start={info.progress.start} end={info.progress.end} paused={info.paused} />;
  else if (info.paused) footer = <div className="text-[10px] text-ink-soft mt-0.5">⏸ paused</div>;
  else if (info.elapsedFrom) footer = <Elapsed start={info.elapsedFrom} />;

  return (
    <div>
      <div className="text-[11px] text-ink-soft uppercase tracking-wide truncate">
        {info.icon} {info.heading}
      </div>
      <div className="flex gap-3 py-2">
        <div className="relative shrink-0 w-11 h-11">
          {info.image ? (
            <img src={info.image} alt={info.title} width={44} height={44} className="block w-11 h-11 object-cover border border-line" />
          ) : (
            <div className="w-11 h-11 border border-dashed border-line grid place-items-center text-ink-soft">?</div>
          )}
          {info.smallImage && (
            <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-paper grid place-items-center" style={{ background: "#2a2130" }}>
              <img src={info.smallImage} alt="" width={12} height={12} className="block w-3 h-3" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-xs leading-snug">
          <div className="font-semibold truncate text-ink" title={info.title}>
            {info.href ? (
              <a href={info.href} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-accent hover:underline">
                {info.title} <span className="text-[10px] text-accent-2">↗</span>
              </a>
            ) : (
              info.title
            )}
          </div>
          <Line text={info.sub} />
          <Line text={info.sub2} />
          {footer}
        </div>
      </div>
    </div>
  );
}

function CustomStatus({ a }: { a: Activity }) {
  const e = a.emoji;
  const url = e ? emojiUrl(e) : null;
  const text = (a.state ?? "").replace(/\s*\n\s*/g, " / ");
  return (
    <div className="flex items-center gap-2 text-xs py-1 min-w-0">
      {url ? <img src={url} alt="" width={18} height={18} className="w-[18px] h-[18px] shrink-0" /> : e?.name ? <span className="shrink-0">{e.name}</span> : null}
      <span className="truncate min-w-0" title={text}>
        {text}
      </span>
    </div>
  );
}

/* ---------- widget ---------- */

export function DiscordPresence({ hideSpotify = false }: { hideSpotify?: boolean } = {}) {
  const { data, live } = useLanyardContext();

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
  // when spotify is connected directly, the sidebar has its own listening window
  const cards = resolveAll(data.activities).filter((c) => !(hideSpotify && c.handler.id === "spotify"));

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <img src={avatarUrl(data.discord_user)} alt="vensin's discord avatar" width={48} height={48} className="w-12 h-12 border border-line" />
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

      {cards.length > 0 && <hr className="dotted-hr" />}

      {cards.map((c) => (
        <ActivityCard key={c.activity.id ?? c.activity.name} info={c.info} />
      ))}

      {cards.length === 0 && !custom && (
        <div className="text-xs text-ink-soft mt-2">
          {data.discord_status === "offline" ? "probably sleeping or touching grass" : "not doing anything special right now"} (￣o￣) zzZ
        </div>
      )}
    </div>
  );
}
