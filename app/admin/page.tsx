import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listGalleryFresh, listMessages, getSettingsFresh, storage } from "@/lib/store";
import { discordNotifyConfigured } from "@/lib/discord-notify";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const [messages, gallery, settings] = await Promise.all([listMessages(), listGalleryFresh(), getSettingsFresh()]);
  const unread = messages.filter((m) => !m.read).length;

  const checks = [
    { label: "storage", ok: storage.persistent, note: storage.kind === "redis" ? "upstash redis" : storage.persistent ? "local json file (dev)" : "NOT persistent on vercel — add upstash redis" },
    { label: "image uploads", ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN), note: process.env.BLOB_READ_WRITE_TOKEN ? "vercel blob" : "local public/uploads (dev only)" },
    { label: "discord notify", ok: discordNotifyConfigured(), note: process.env.DISCORD_BOT_TOKEN ? "bot dm" : process.env.DISCORD_WEBHOOK_URL ? "webhook" : "not configured" },
    { label: "weather", ok: Boolean(process.env.WEATHER_LAT && process.env.WEATHER_LON), note: "env coords" },
  ];

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <Link href="/admin/messages" className="border border-dashed border-line bg-paper-2 py-2 no-underline">
          <div className="pixel text-2xl text-accent-2">{unread}</div>
          <div className="text-ink-soft">unread messages</div>
        </Link>
        <Link href="/admin/gallery" className="border border-dashed border-line bg-paper-2 py-2 no-underline">
          <div className="pixel text-2xl text-accent-2">{gallery.length}</div>
          <div className="text-ink-soft">photos</div>
        </Link>
        <Link href="/admin/updates" className="border border-dashed border-line bg-paper-2 py-2 no-underline">
          <div className="pixel text-2xl text-accent-2">{settings.updateLog.length}</div>
          <div className="text-ink-soft">update entries</div>
        </Link>
      </div>

      <Window title="system" dashed bodyClassName="text-xs">
        <ul className="grid gap-1">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className="status-dot" style={{ background: c.ok ? "var(--ok)" : "var(--idle)", borderWidth: 0 }} />
              <span className="w-28">{c.label}</span>
              <span className="text-ink-soft">{c.note}</span>
            </li>
          ))}
        </ul>
      </Window>
    </div>
  );
}
