import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { LanyardDataSchema } from "@/components/discord/schemas";
import { resolveAll } from "@/components/discord/activities";
import { getLatestFresh, listSeenActivities, markActivitySeen, saveLatest, type Latest } from "@/lib/store";
import { notifyUnknownActivity } from "@/lib/discord-notify";

// Visitors' browsers ping this route while they watch the Discord widget.
// The server then asks Lanyard itself (source of truth), remembers the last
// activity per kind for the "latest" box, and DMs the owner once per unknown site.

const MIN_INTERVAL_MS = 60_000;
let lastRun = 0;

export async function POST() {
  const now = Date.now();
  if (now - lastRun < MIN_INTERVAL_MS) return NextResponse.json({ ok: true, skipped: "throttled" });
  lastRun = now;

  const current = await getLatestFresh();
  if (current.checkedAt && now - new Date(current.checkedAt).getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, skipped: "fresh" });
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${site.discordUserId}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
    const parsed = LanyardDataSchema.safeParse((await res.json())?.data);
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 502 });

    const at = new Date(now).toISOString();
    const next: Latest = { items: { ...(current.items ?? {}) }, checkedAt: at };

    const resolved = resolveAll(parsed.data.activities);
    for (const r of resolved) {
      if (r.info.latest) next.items![r.info.kind] = { value: r.info.latest.value, href: r.info.latest.href ?? null, at };
    }
    await saveLatest(next);

    // unknown browser presences: tell the owner once, with the raw payload
    const unknown = resolved.filter((r) => r.handler.id === "browsing");
    if (unknown.length) {
      const seen = await listSeenActivities();
      for (const r of unknown) {
        const key = `${r.activity.name}|${r.activity.application_id ?? ""}`;
        if (seen.includes(key)) continue;
        await markActivitySeen(key);
        await notifyUnknownActivity(r.activity, r.activity.name);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
