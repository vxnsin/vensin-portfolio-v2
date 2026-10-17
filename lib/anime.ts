import { parse } from "node-html-parser";
import { aniworldProfile, favoriteAnime } from "@/data/anime";
import { cached } from "./cache";
import { CACHE_KEYS, TTL } from "./jobs";
import { kitsuByMalId, kitsuSearch } from "./kitsu";
import { listFavorites } from "./store";
import { recordWatched } from "./anime-log";

export type WatchedAnime = {
  title: string;
  genre: string;
  cover: string | null;
  url: string;
  season: string | null;
  episode: string | null;
};

const ANIWORLD = "https://aniworld.to";

/** the watched page, newest first: every episode the profile lists (capped by the site at about a thousand) */
export async function scrapeWatched(limit = Infinity): Promise<WatchedAnime[] | null> {
  const res = await fetch(`${ANIWORLD}/user/profil/${aniworldProfile}/watched`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; vensin.dev)" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const root = parse(await res.text());
  const items = root.querySelectorAll(".coverListItem").slice(0, limit);
  const out: WatchedAnime[] = [];
  for (const el of items) {
    const link = el.querySelector("a")?.getAttribute("href") ?? "";
    const img = el.querySelector("img");
    const raw = img?.getAttribute("data-src") ?? img?.getAttribute("src") ?? "";
    out.push({
      title: el.querySelector("h3")?.text.trim() || "Unknown",
      genre: el.querySelector("small")?.text.trim() || "",
      cover: raw ? (raw.startsWith("http") ? raw : ANIWORLD + raw) : null,
      url: link ? ANIWORLD + link : ANIWORLD,
      season: link.match(/staffel-(\d+)/)?.[1] ?? null,
      episode: link.match(/episode-(\d+)/)?.[1] ?? null,
    });
  }
  return out;
}

/** Recently watched episodes, covers + links upgraded via Kitsu. */
export async function fetchRecentlyWatched(): Promise<WatchedAnime[] | null> {
  // aniworld lists every episode on its own, so a binge fills the top with one title: scan the whole page until eight different anime are found
  const scanned = await scrapeWatched();
  if (!scanned) return null;
  const out = scanned.slice(0, 12);

  // de-dupe by title (several episodes of the same show), keep newest: the last eight different anime
  const seen = new Set<string>();
  const unique = scanned.filter((a) => (seen.has(a.title) ? false : (seen.add(a.title), true))).slice(0, 12);

  const sources = new Map(unique.map((a) => [a.title, a.url]));
  for (const a of unique) {
    const k = await kitsuSearch(a.title);
    if (k?.posterSmall ?? k?.poster) a.cover = k.posterSmall ?? k.poster;
    if (k?.url) a.url = k.url;
  }
  // every episode seen goes into the watch log once (all of them, not only the de-duped shelf)
  try {
    await recordWatched(
      out.map((a) => ({ title: a.title, season: a.season ? Number(a.season) : null, episode: a.episode ? Number(a.episode) : null, sourceUrl: sources.get(a.title) ?? a.url, url: unique.find((u) => u.title === a.title)?.url ?? a.url, cover: unique.find((u) => u.title === a.title)?.cover ?? null })),
    );
  } catch {}
  return unique;
}
export type ShelfAnime = { title: string; url: string; cover: string | null };
export type AnimeLists = { watched: ShelfAnime[]; watchlist: ShelfAnime[]; fetchedAt: string };

async function fetchList(path: string): Promise<ShelfAnime[] | null> {
  const res = await fetch(`${ANIWORLD}/user/profil/${aniworldProfile}/${path}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; vensin.dev)" }, cache: "no-store" });
  if (!res.ok) return null;
  const root = parse(await res.text());
  const out: ShelfAnime[] = [];
  const seen = new Set<string>();
  for (const el of root.querySelectorAll(".coverListItem")) {
    const title = el.querySelector("h3")?.text.trim();
    const link = el.querySelector("a")?.getAttribute("href") ?? "";
    if (!title || seen.has(title)) continue;
    seen.add(title);
    out.push({ title, url: link ? ANIWORLD + link : ANIWORLD, cover: null });
  }
  return out;
}

/** "abonnierte animes" are the ones i watched, the watchlist is what's still ahead. posters via kitsu (cached per title). */
export async function fetchAnimeLists(): Promise<AnimeLists | null> {
  const [watched, watchlist] = await Promise.all([fetchList("subscribed"), fetchList("watchlist")]);
  if (!watched || !watchlist) return null;
  for (const a of [...watched, ...watchlist]) {
    const k = await kitsuSearch(a.title);
    if (k?.posterSmall ?? k?.poster) a.cover = k.posterSmall ?? k.poster;
    if (k?.url) a.url = k.url;
  }
  return { watched, watchlist, fetchedAt: new Date().toISOString() };
}
export async function getAnimeLists(): Promise<AnimeLists | null> {
  return cached(CACHE_KEYS.animeLists, TTL.animeLists, fetchAnimeLists);
}

export type ProfileStats = { episodes: number; fetchedAt: string };

/** "<n> Episoden" from the profile header: the true all-time count, unlike the capped watched list */
export async function fetchProfileStats(): Promise<ProfileStats | null> {
  const res = await fetch(`${ANIWORLD}/user/profil/${aniworldProfile}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; vensin.dev)" }, cache: "no-store" });
  if (!res.ok) return null;
  const m = (await res.text()).match(/<span>\s*([\d.]+)\s*<\/span>\s*Episoden/);
  if (!m) return null;
  return { episodes: Number(m[1].replace(/\./g, "")), fetchedAt: new Date().toISOString() };
}
export async function getProfileStats(): Promise<ProfileStats | null> {
  return cached(CACHE_KEYS.animeProfile, TTL.animeProfile, fetchProfileStats);
}

export async function getRecentlyWatched(): Promise<WatchedAnime[]> {
  return (await cached(CACHE_KEYS.animeRecent, TTL.animeRecent, fetchRecentlyWatched)) ?? [];
}

export type FavoriteWithCover = {
  id: string;
  title: string;
  note?: string;
  cover: string | null;
  url: string;
  rating: number | null; // own rating (admin) or community rating (seed list)
  own: boolean;
};

/** Favorites from the admin panel; falls back to the seed list in data/anime.ts (posters via MAL-id mapping). */
export async function getFavorites(): Promise<FavoriteWithCover[]> {
  const stored = await listFavorites();
  if (stored.length > 0) {
    return stored.map((f) => ({
      id: f.id,
      title: f.title,
      note: f.note || undefined,
      cover: f.poster,
      url: `https://kitsu.app/anime/${f.slug || f.kitsuId}`,
      rating: f.rating,
      own: true,
    }));
  }

  const out: FavoriteWithCover[] = [];
  for (const fav of favoriteAnime) {
    const k = (await kitsuByMalId(fav.malId)) ?? (await kitsuSearch(fav.title));
    out.push({
      id: String(fav.malId),
      title: fav.title,
      note: fav.note,
      cover: k?.poster ?? null,
      rating: k?.rating ?? null,
      url: k?.url ?? `https://myanimelist.net/anime/${fav.malId}`,
      own: false,
    });
  }
  return out;
}
