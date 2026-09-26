import { parse } from "node-html-parser";
import { aniworldProfile, favoriteAnime } from "@/data/anime";
import { kitsuByMalId, kitsuSearch } from "./kitsu";

export type WatchedAnime = {
  title: string;
  genre: string;
  cover: string | null;
  url: string;
  season: string | null;
  episode: string | null;
};

const ANIWORLD = "https://aniworld.to";

/** Recently watched episodes from a public aniworld.to profile, covers upgraded via Kitsu. Cached 1h. Returns [] on failure. */
export async function getRecentlyWatched(): Promise<WatchedAnime[]> {
  try {
    const res = await fetch(`${ANIWORLD}/user/profil/${aniworldProfile}/watched`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; vensin.dev)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const root = parse(await res.text());
    const items = root.querySelectorAll(".coverListItem").slice(0, 12);

    const out: WatchedAnime[] = [];
    for (const el of items) {
      const link = el.querySelector("a")?.getAttribute("href") ?? "";
      const img = el.querySelector("img");
      const raw = img?.getAttribute("data-src") ?? img?.getAttribute("src") ?? "";
      const title = el.querySelector("h3")?.text.trim() || "Unknown";
      out.push({
        title,
        genre: el.querySelector("small")?.text.trim() || "",
        cover: raw ? (raw.startsWith("http") ? raw : ANIWORLD + raw) : null,
        url: link ? ANIWORLD + link : ANIWORLD,
        season: link.match(/staffel-(\d+)/)?.[1] ?? null,
        episode: link.match(/episode-(\d+)/)?.[1] ?? null,
      });
    }

    // de-dupe by title (several episodes of the same show), keep newest
    const seen = new Set<string>();
    const unique = out.filter((a) => (seen.has(a.title) ? false : (seen.add(a.title), true))).slice(0, 8);

    // upgrade covers to Kitsu posters (sequential to be polite)
    for (const a of unique) {
      const k = await kitsuSearch(a.title);
      if (k?.poster) a.cover = k.poster;
    }
    return unique;
  } catch {
    return [];
  }
}

export type FavoriteWithCover = {
  title: string;
  note?: string;
  malId: number;
  cover: string | null;
  url: string;
  rating: number | null;
};

/** Favorite posters from Kitsu via MAL-id mapping, text search as fallback. Cached 24h. */
export async function getFavorites(): Promise<FavoriteWithCover[]> {
  const out: FavoriteWithCover[] = [];
  for (const fav of favoriteAnime) {
    const k = (await kitsuByMalId(fav.malId)) ?? (await kitsuSearch(fav.title));
    out.push({
      ...fav,
      cover: k?.poster ?? null,
      rating: k?.rating ?? null,
      url: k?.url ?? `https://myanimelist.net/anime/${fav.malId}`,
    });
  }
  return out;
}
