"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { useLanyardContext } from "./LanyardProvider";
import { codingInfo, isBrowsing, isCoding, watchingInfo } from "./detect";
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

function assetUrl(img: string | undefined, applicationId?: string): string | null {
  if (!img) return null;
  if (img.startsWith("mp:external/")) return `https://media.discordapp.net/external/${img.slice("mp:external/".length)}`;
  if (img.startsWith("mp:")) return `https://media.discordapp.net/${img.slice(3)}`;
  if (img.startsWith("spotify:")) return `https://i.scdn.co/image/${img.slice(8)}`;
  if (applicationId) return `https://cdn.discordapp.com/app-assets/${applicationId}/${img}.png`;
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

/** PreMiD-style presences (YouTube, AniWorld, Netflix, …) put the playback state in the small asset text. */
function playback(a: Activity): "playing" | "paused" | null {
  const t = (a.assets?.small_text ?? "").toLowerCase();
  if (/paus/.test(t)) return "paused";
  if (/play|live|watch/.test(t)) return "playing";
  return null;
}

/* ---------- building blocks ---------- */

function Heading({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="text-[11px] text-ink-soft uppercase tracking-wide truncate">
      {icon} {children}
    </div>
  );
}

function Row({
  icon,
  smallIcon,
  title,
  href,
  sub,
  sub2,
  footer,
}: {
  icon?: string | null;
  smallIcon?: string | null;
  title: string;
  href?: string | null;
  sub?: string | null;
  sub2?: string | null;
  footer?: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2">
      <div className="relative shrink-0 w-11 h-11">
        {icon ? (
          <img src={icon} alt="" width={44} height={44} className="block w-11 h-11 object-cover border border-line" />
        ) : (
          <div className="w-11 h-11 border border-dashed border-line grid place-items-center text-ink-soft">?</div>
        )}
        {smallIcon && (
          <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-paper grid place-items-center" style={{ background: "#2a2130" }}>
            <img src={smallIcon} alt="" width={12} height={12} className="block w-3 h-3" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-xs leading-snug">
        <div className="font-semibold truncate text-ink" title={title}>
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="text-ink no-underline hover:text-accent hover:underline">
              {title}
            </a>
          ) : (
            title
          )}
        </div>
        {sub && (
          <div className="truncate text-ink-soft" title={sub}>
            {sub}
          </div>
        )}
        {sub2 && (
          <div className="truncate text-ink-soft" title={sub2}>
            {sub2}
          </div>
        )}
        {footer}
      </div>
    </div>
  );
}

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

/* ---------- activity renderers ---------- */

function Spotify({ s }: { s: NonNullable<LanyardData["spotify"]> }) {
  const start = s.timestamps?.start ?? 0;
  const end = s.timestamps?.end ?? 0;
  return (
    <div>
      <Heading icon="♪">listening on spotify</Heading>
      <Row
        icon={s.album_art_url ?? null}
        title={s.song}
        href={s.track_id ? `https://open.spotify.com/track/${s.track_id}` : null}
        sub={`by ${s.artist}`}
        sub2={s.album ? `on ${s.album}` : null}
        footer={end > start ? <Progress start={start} end={end} /> : null}
      />
    </div>
  );
}

/** type 3 "watching": YouTube, AniWorld, Netflix … (PreMiD). Video title in details, channel/series in state. */
function Watching({ a }: { a: Activity }) {
  const start = a.timestamps?.start;
  const end = a.timestamps?.end;
  const state = playback(a);
  const paused = state === "paused";
  const info = watchingInfo(a);
  return (
    <div>
      <Heading icon={paused ? "⏸" : "▶"}>
        {paused ? "paused" : "watching"} {info.anime ? "anime" : `on ${a.name}`}
      </Heading>
      <Row
        icon={assetUrl(a.assets?.large_image, a.application_id)}
        smallIcon={assetUrl(a.assets?.small_image, a.application_id)}
        title={info.title}
        sub={info.sub}
        sub2={info.sub2}
        footer={
          start && end && end > start ? (
            <Progress start={start} end={end} paused={paused} />
          ) : paused ? (
            <div className="text-[10px] text-ink-soft mt-0.5">⏸ paused</div>
          ) : start ? (
            <Elapsed start={start} />
          ) : null
        }
      />
    </div>
  );
}

/** editor presence (vscord & co.) */
function Coding({ a }: { a: Activity }) {
  const start = a.timestamps?.start;
  const c = codingInfo(a);
  const meta = [c.language, c.problems].filter(Boolean).join(" · ");
  return (
    <div>
      <Heading icon="💻">coding in {c.editor}</Heading>
      <Row
        icon={assetUrl(a.assets?.large_image, a.application_id)}
        smallIcon={assetUrl(a.assets?.small_image, a.application_id)}
        title={c.workspace ?? c.editor}
        sub={c.file}
        sub2={meta || null}
        footer={start ? <Elapsed start={start} /> : null}
      />
    </div>
  );
}

/** everything else: games, streaming, generic rich presence */
function Generic({ a }: { a: Activity }) {
  const start = a.timestamps?.start;
  const end = a.timestamps?.end;
  const browsing = isBrowsing(a);
  return (
    <div>
      <Heading icon={browsing ? "🌐" : a.type === 0 ? "🎮" : "•"}>
        {browsing ? "browsing" : verb(a)} {a.name}
      </Heading>
      <Row
        icon={assetUrl(a.assets?.large_image, a.application_id)}
        smallIcon={assetUrl(a.assets?.small_image, a.application_id)}
        title={a.details || a.name}
        sub={a.state ?? null}
        sub2={a.assets?.large_text ?? null}
        footer={start && end && end > start ? <Progress start={start} end={end} /> : start ? <Elapsed start={start} /> : null}
      />
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

export function DiscordPresence() {
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
  const watching = data.activities.filter((a) => a.type === 3);
  const coding = data.activities.filter(isCoding);
  const others = data.activities.filter((a) => a.type !== 4 && a.type !== 3 && a.name !== "Spotify" && !isCoding(a));
  const hasActivity = Boolean(data.spotify) || watching.length > 0 || coding.length > 0 || others.length > 0;

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

      {hasActivity && <hr className="dotted-hr" />}

      {data.spotify && <Spotify s={data.spotify} />}
      {coding.map((a) => (
        <Coding key={a.id ?? a.name} a={a} />
      ))}
      {watching.map((a) => (
        <Watching key={a.id ?? a.name} a={a} />
      ))}
      {others.map((a) => (
        <Generic key={a.id ?? a.name} a={a} />
      ))}

      {!hasActivity && !custom && (
        <div className="text-xs text-ink-soft mt-2">
          {data.discord_status === "offline" ? "probably sleeping or touching grass" : "not doing anything special right now"} (￣o￣) zzZ
        </div>
      )}
    </div>
  );
}
