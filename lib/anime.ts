import { parse } from "node-html-parser";
import { aniworldProfile, favoriteAnime } from "@/data/anime";

export type WatchedAnime = {
  title: string;
  genre: string;
  cover: string;
  url: string;
  season: string | null;
  episode: string | null;
};

const ANIWORLD = "https://aniworld.to";

/** Recently watched episodes from a public aniworld.to profile. Cached for 1h. Returns [] on any failure. */
export async function getRecentlyWatched(): Promise<WatchedAnime[]> {
  try {
    const res = await fetch(`${ANIWORLD}/user/profil/${aniworldProfile}/watched`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; vensin.dev)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const root = parse(await res.text());
    const items = root.querySelectorAll(".coverListItem");
    const out: WatchedAnime[] = [];
    for (const el of items) {
      const link = el.querySelector("a")?.getAttribute("href") ?? "";
      const img = el.querySelector("img");
      const cover = img?.getAttribute("data-src") ?? img?.getAttribute("src") ?? "";
      out.push({
        title: el.querySelector("h3")?.text.trim() || "Unknown",
        genre: el.querySelector("small")?.text.trim() || "",
        cover: cover ? (cover.startsWith("http") ? cover : ANIWORLD + cover) : "",
        url: link ? ANIWORLD + link : ANIWORLD,
        season: link.match(/staffel-(\d+)/)?.[1] ?? null,
        episode: link.match(/episode-(\d+)/)?.[1] ?? null,
      });
    }
    return out.slice(0, 8);
  } catch {
    return [];
  }
}

export type FavoriteWithCover = { title: string; note?: string; malId: number; cover: string | null; url: string; score: number | null };

/** Favorite covers from Jikan (MyAnimeList). Cached for 24h. Jikan allows ~3 req/s, so requests run sequentially. */
export async function getFavorites(): Promise<FavoriteWithCover[]> {
  const out: FavoriteWithCover[] = [];
  for (const fav of favoriteAnime) {
    let cover: string | null = null;
    let score: number | null = null;
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${fav.malId}`, { next: { revalidate: 86400 } });
      if (res.ok) {
        const json = await res.json();
        cover = json?.data?.images?.webp?.large_image_url ?? json?.data?.images?.jpg?.large_image_url ?? null;
        score = typeof json?.data?.score === "number" ? json.data.score : null;
      }
    } catch {}
    out.push({ ...fav, cover, score, url: `https://myanimelist.net/anime/${fav.malId}` });
    await new Promise((r) => setTimeout(r, 350));
  }
  return out;
}
