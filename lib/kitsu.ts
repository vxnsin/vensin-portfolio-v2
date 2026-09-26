// Kitsu API (https://kitsu.docs.apiary.io) — public, no key, high-res posters (550x780).
import { cached, DAY } from "./cache";

const API = "https://kitsu.app/api/edge";
const HEADERS = { accept: "application/vnd.api+json" };
const FIELDS = "fields[anime]=canonicalTitle,posterImage,averageRating,slug";

export type KitsuAnime = {
  title: string;
  slug: string;
  url: string;
  poster: string | null; // large (550x780)
  posterSmall: string | null; // small (284x402)
  rating: number | null; // 0-10
};

type Raw = {
  id?: string;
  attributes?: {
    canonicalTitle?: string;
    slug?: string;
    averageRating?: string | null;
    startDate?: string | null;
    synopsis?: string | null;
    posterImage?: { large?: string; small?: string; medium?: string; original?: string } | null;
  };
};

function map(raw?: Raw): KitsuAnime | null {
  const a = raw?.attributes;
  if (!a?.slug) return null;
  const rating = a.averageRating ? Math.round(parseFloat(a.averageRating)) / 10 : null;
  return {
    title: a.canonicalTitle ?? a.slug,
    slug: a.slug,
    url: `https://kitsu.app/anime/${a.slug}`,
    poster: a.posterImage?.large ?? a.posterImage?.original ?? null,
    posterSmall: a.posterImage?.small ?? a.posterImage?.medium ?? null,
    rating: rating && !Number.isNaN(rating) ? rating : null,
  };
}

/** Exact lookup via MyAnimeList id. Cached 7 days. */
export function kitsuByMalId(malId: number): Promise<KitsuAnime | null> {
  return cached(`kitsu:mal:${malId}`, 7 * DAY, async () => {
    const res = await fetch(`${API}/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}&include=item&${FIELDS}`, {
      headers: HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return map((await res.json())?.included?.[0]);
  });
}

/** Fuzzy lookup by title (used for aniworld entries that only give us a name). Cached 7 days. */
export function kitsuSearch(title: string): Promise<KitsuAnime | null> {
  return cached(`kitsu:q:${title.toLowerCase()}`, 7 * DAY, async () => {
    const res = await fetch(`${API}/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1&${FIELDS}`, { headers: HEADERS, cache: "no-store" });
    if (!res.ok) return null;
    return map((await res.json())?.data?.[0]);
  });
}

export type KitsuHit = KitsuAnime & { id: string; year: string | null; synopsis: string | null };

/** Search suggestions for the admin panel. Not cached (typed live). */
export async function kitsuSearchMany(query: string, limit = 8): Promise<KitsuHit[]> {
  try {
    const res = await fetch(
      `${API}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=${limit}&fields[anime]=canonicalTitle,posterImage,averageRating,slug,startDate,synopsis`,
      { headers: HEADERS, cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const out: KitsuHit[] = [];
    for (const raw of json?.data ?? []) {
      const m = map(raw);
      if (!m) continue;
      out.push({
        ...m,
        id: String(raw.id),
        year: raw.attributes?.startDate?.slice(0, 4) ?? null,
        synopsis: raw.attributes?.synopsis ? String(raw.attributes.synopsis).slice(0, 160) : null,
      });
    }
    return out;
  } catch {
    return [];
  }
}
