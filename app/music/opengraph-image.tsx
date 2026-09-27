import { ogImage, OG_SIZE } from "@/lib/og";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";
import { listenStats } from "@/lib/listens";

export const alt = "music on vensin.dev";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  const now = spotifyConnected() ? await getNowPlaying() : null;
  const log = listenStats();
  const hours = Math.round(log.minutesThisYear / 60);
  if (now?.playing && now.track) {
    return ogImage({ kicker: "music · playing right now", title: now.track.name, subtitle: `by ${now.track.artists.join(", ")} · ${hours}h listened this year`, images: now.track.art ? [now.track.art] : [], accent: "#b0a4ff" });
  }
  const last = log.lastPlayed;
  return ogImage({ kicker: "music", title: "what's in my ears", subtitle: last ? `last heard: ${last.song} by ${last.artist} · ${hours}h this year` : `${hours}h listened this year`, images: last?.art ? [last.art] : [], accent: "#b0a4ff" });
}
