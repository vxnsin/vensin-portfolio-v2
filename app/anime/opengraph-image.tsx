import { ogImage, OG_SIZE } from "@/lib/og";
import { getRecentlyWatched, getFavorites } from "@/lib/anime";

export const alt = "anime on vensin.dev";
export const size = OG_SIZE;
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image() {
  const [recent, favorites] = await Promise.all([getRecentlyWatched(), getFavorites()]);
  const posters = [...recent, ...favorites].map((a) => a.cover).filter((c): c is string => Boolean(c)).slice(0, 4);
  const latest = recent[0];
  return ogImage({
    kicker: "anime",
    title: latest ? `watching ${latest.title}` : "what i'm watching",
    subtitle: `${favorites.length} all-time favorites · recently watched, posters via kitsu`,
    images: posters,
    accent: "#ff8fb4",
  });
}
