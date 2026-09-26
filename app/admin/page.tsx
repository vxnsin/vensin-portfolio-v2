import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listGallery, listMessages, getSettings, getHealth, getLatest, getJobRun, storage, listFavorites } from "@/lib/store";
import { discordButtonsConfigured, discordNotifyConfigured } from "@/lib/discord-notify";
import { guestbookCounts } from "@/lib/guestbook";
import { jobs, CACHE_KEYS } from "@/lib/jobs";
import { peek } from "@/lib/cache";
import { getMaintenance } from "@/lib/maintenance";
import { backupToDiscordConfigured, listBackups, BACKUP_DIR } from "@/lib/backup";
import { relativeTime } from "@/lib/time";
import { runJobAction } from "./actions";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

const JOB_CACHE: Record<string, string> = {
  weather: CACHE_KEYS.weather,
  "github-activity": CACHE_KEYS.githubActivity,
  "anime-recent": CACHE_KEYS.animeRecent,
  "github-stats": CACHE_KEYS.githubStats,
  "github-contributions": CACHE_KEYS.githubContributions,
};

const humanMs = (ms: number) => (ms >= 3600_000 ? `${ms / 3600_000}h` : `${ms / 60_000} min`);

export default async function AdminHome() {
  await requireAdmin();
  const [messages, gallery, settings, health, latest, favorites] = await Promise.all([listMessages(), listGallery(), getSettings(), getHealth(), getLatest(), listFavorites()]);
  const unread = messages.filter((m) => !m.read).length;
  const guestbook = guestbookCounts();
  const schedulerOn = process.env.SCHEDULER !== "off" && !process.env.VERCEL;

  const maintenance = getMaintenance();
  const backups = listBackups();
  const lastBackup = getJobRun("backup");
  const checks = [
    { label: "maintenance", ok: !maintenance.on, note: maintenance.on ? "ON — visitors see the maintenance page" : "off, site is live" },
    { label: "storage", ok: storage.persistent, note: storage.persistent ? `sqlite · ${storage.file}` : "sqlite in /tmp — NOT persistent on vercel" },
    { label: "scheduler", ok: schedulerOn, note: schedulerOn ? "running in-process" : "off (serverless) — data refreshes on demand" },
    { label: "uploads", ok: true, note: process.env.BLOB_READ_WRITE_TOKEN ? "vercel blob" : "local folder (public/uploads)" },
    { label: "discord notify", ok: discordNotifyConfigured(), note: process.env.DISCORD_BOT_TOKEN ? "bot dm" : process.env.DISCORD_WEBHOOK_URL ? "webhook" : "not configured" },
    { label: "discord buttons", ok: discordButtonsConfigured(), note: discordButtonsConfigured() ? "interactions endpoint ready (/api/discord/interactions)" : "set DISCORD_PUBLIC_KEY + interactions url in the developer portal" },
    { label: "weather", ok: Boolean(process.env.WEATHER_LAT && process.env.WEATHER_LON), note: "env coords" },
    { label: "backups", ok: backups.length > 0 && Boolean(lastBackup?.ok), note: backups.length ? `${backups.length} local${backupToDiscordConfigured() ? " + discord upload" : " only (set DISCORD_BACKUP_CHANNEL_ID or DISCORD_BACKUP_WEBHOOK_URL)"}` : "none yet — runs nightly at 03:30" },
    {
      label: "ios shortcut",
      ok: Boolean(process.env.HEALTH_TOKEN) && Boolean(health),
      note: !process.env.HEALTH_TOKEN ? "set HEALTH_TOKEN" : health ? `last sync ${relativeTime(health.updatedAt)}` : "token set, waiting for first shortcut run",
    },
    { label: "latest activity", ok: Boolean(latest.checkedAt), note: latest.checkedAt ? `checked ${relativeTime(latest.checkedAt)}` : "not checked yet" },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
        <Stat href="/admin/messages" value={unread} label="unread messages" />
        <Stat href="/admin/guestbook" value={guestbook.pending} label={`guestbook to review · ${guestbook.approved} live`} />
        <Stat href="/admin/gallery" value={gallery.length} label="photos & videos" />
        <Stat href="/admin/anime" value={favorites.length} label="favorite anime" />
        <Stat href="/admin/updates" value={settings.updateLog.length} label="update entries" />
      </div>

      <Window title="system" dashed bodyClassName="text-xs">
        <ul className="grid gap-1">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className="status-dot shrink-0" style={{ background: c.ok ? "var(--ok)" : "var(--idle)", borderWidth: 0 }} />
              <span className="w-28 shrink-0">{c.label}</span>
              <span className="text-ink-soft truncate">{c.note}</span>
            </li>
          ))}
        </ul>
      </Window>

      <Window title="scheduled jobs" dashed bodyClassName="text-xs overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead className="text-ink-soft text-left">
            <tr>
              <th className="font-normal pb-1">job</th>
              <th className="font-normal pb-1">schedule</th>
              <th className="font-normal pb-1">last run</th>
              <th className="font-normal pb-1">cached</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const run = getJobRun(j.id);
              const key = JOB_CACHE[j.id];
              const c = key ? peek(key) : null;
              return (
                <tr key={j.id} className="border-t border-dashed border-line">
                  <td className="py-1 pr-2">{j.label}</td>
                  <td className="py-1 pr-2 text-ink-soft">{j.every ? `every ${humanMs(j.every)}` : `daily ${j.daily}`}</td>
                  <td className="py-1 pr-2" title={run?.error}>
                    {run ? (
                      <>
                        <span className="status-dot inline-block mr-1" style={{ background: run.ok ? "var(--ok)" : "var(--dnd)", borderWidth: 0, width: 7, height: 7 }} />
                        {relativeTime(run.at)} <span className="text-ink-soft">({run.ms} ms)</span>
                      </>
                    ) : (
                      <span className="text-ink-soft">never</span>
                    )}
                  </td>
                  <td className="py-1 pr-2 text-ink-soft">{c ? `${relativeTime(new Date(c.fetchedAt).toISOString())}${c.fresh ? "" : " · stale"}` : "—"}</td>
                  <td className="py-1 text-right">
                    <form action={runJobAction}>
                      <input type="hidden" name="id" value={j.id} />
                      <button type="submit" className="btn text-[10px]">
                        run now
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Window>

      <Window title="backups" dashed bodyClassName="text-xs">
        <p className="text-ink-soft mb-2">
          a gzipped copy of the sqlite file every night at 03:30, kept in <code>{BACKUP_DIR}</code> (last {process.env.BACKUP_KEEP ?? 14})
          {backupToDiscordConfigured() ? " and posted to your discord backup channel" : ". add DISCORD_BACKUP_CHANNEL_ID (bot) or DISCORD_BACKUP_WEBHOOK_URL to get a copy on discord too"}. to restore: stop the
          site, gunzip the file, put it in place as vensin.sqlite, delete the -wal and -shm files next to it, start again.
        </p>
        {backups.length === 0 ? (
          <p className="text-ink-soft">no backups yet.</p>
        ) : (
          <ul className="grid gap-0.5 font-mono">
            {backups.slice(0, 10).map((b) => (
              <li key={b.name} className="flex justify-between gap-3">
                <span>{b.name}</span>
                <span className="text-ink-soft">{(b.size / 1024).toFixed(1)} kb · {relativeTime(b.at)}</span>
              </li>
            ))}
            {backups.length > 10 && <li className="text-ink-soft">… and {backups.length - 10} more</li>}
          </ul>
        )}
        <form action={runJobAction} className="mt-2">
          <input type="hidden" name="id" value="backup" />
          <button type="submit" className="btn text-[11px]">
            backup now
          </button>
        </form>
      </Window>

      <p className="text-[10px] text-ink-soft">
        <Link href="/">← back to the site</Link>
      </p>
    </div>
  );
}

function Stat({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link href={href} className="border border-dashed border-line bg-paper-2 py-2 no-underline">
      <div className="pixel text-2xl text-accent-2">{value}</div>
      <div className="text-ink-soft">{label}</div>
    </Link>
  );
}
