// Kitsu API (https://kitsu.docs.apiary.io) — public, no key, high-res posters (550x780).
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
  attributes?: {
    canonicalTitle?: string;
    slug?: string;
    averageRating?: string | null;
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

/** Exact lookup via MyAnimeList id. Cached 24h. */
export async function kitsuByMalId(malId: number): Promise<KitsuAnime | null> {
  try {
    const res = await fetch(
      `${API}/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}&include=item&${FIELDS}`,
      { headers: HEADERS, next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return map(json?.included?.[0]);
  } catch {
    return null;
  }
}

/** Fuzzy lookup by title (used for aniworld entries that only give us a name). Cached 24h. */
export async function kitsuSearch(title: string): Promise<KitsuAnime | null> {
  try {
    const res = await fetch(`${API}/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1&${FIELDS}`, {
      headers: HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return map(json?.data?.[0]);
  } catch {
    return null;
  }
}
