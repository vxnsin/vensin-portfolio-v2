import { site } from "@/data/site";
import { LanyardDataSchema } from "@/components/discord/schemas";
import { resolveAll } from "@/components/discord/activities";
import { getLatest, listSeenActivities, markActivitySeen, saveLatest, type Latest } from "./store";
import { notifyUnknownActivity } from "./discord-notify";
import { recordListen } from "./listens";
import { spotifyConnected } from "./spotify";

/**
 * Ask Lanyard what's running, remember the last activity per kind for the "latest" box,
 * and DM the owner once per unknown browser presence. Runs every minute from the scheduler
 * (and on demand from /api/latest as a fallback when no scheduler is running).
 */
export async function refreshLatest(): Promise<boolean> {
  const res = await fetch(`https://api.lanyard.rest/v1/users/${site.discordUserId}`, { cache: "no-store" });
  if (!res.ok) return false;
  const parsed = LanyardDataSchema.safeParse((await res.json())?.data);
  if (!parsed.success) return false;

  const at = new Date().toISOString();
  const current = await getLatest();
  const next: Latest = { items: { ...(current.items ?? {}) }, checkedAt: at };

  const resolved = resolveAll(parsed.data.activities);
  for (const r of resolved) {
    if (r.info.latest) next.items![r.info.kind] = { value: r.info.latest.value, href: r.info.latest.href ?? null, at };
  }
  await saveLatest(next);

  // one row per minute while spotify is playing feeds the music page (hours, top tracks, listening clock)
  if (parsed.data.spotify && !spotifyConnected()) recordListen(parsed.data.spotify, at);

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
  return true;
}
