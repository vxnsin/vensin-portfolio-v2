import { kvGet, kvSet } from "./db";
import { cached, HOUR } from "./cache";

// Spotify Web API. One-time login in /admin/spotify stores a refresh token in sqlite; the scheduler
// refreshes top tracks, top artists, recently played and playlists every hour.

const ACCOUNTS = "https://accounts.spotify.com";
const API = "https://api.spotify.com/v1";
export const SPOTIFY_SCOPES = "user-top-read user-read-recently-played playlist-read-private user-read-currently-playing user-read-playback-state";
export const SPOTIFY_NOW_KEY = "spotify:now";
export const SPOTIFY_NOW_TTL = 25_000;
export const SPOTIFY_CACHE_KEY = "spotify:data";
export const SPOTIFY_TTL = HOUR;

const clientId = () => process.env.SPOTIFY_CLIENT_ID ?? "";
const clientSecret = () => process.env.SPOTIFY_CLIENT_SECRET ?? "";
export const spotifyConfigured = () => Boolean(clientId() && clientSecret());
export const spotifyConnected = () => Boolean(kvGet<string | null>("spotify:refresh", null));
/** the host the spotify app knows: SPOTIFY_REDIRECT_BASE, else the production url in production, else 127.0.0.1 (spotify rejects "localhost") */
export const spotifyRedirectBase = () => {
  const base = process.env.SPOTIFY_REDIRECT_BASE ?? (process.env.NODE_ENV === "production" ? "https://vensin.dev" : "http://127.0.0.1:3000");
  return base.endsWith("/") ? base.slice(0, -1) : base;
};
export const spotifyRedirectUri = () => `${spotifyRedirectBase()}/api/spotify/callback`;

export function spotifyAuthUrl(state: string) {
  const p = new URLSearchParams({ client_id: clientId(), response_type: "code", redirect_uri: spotifyRedirectUri(), scope: SPOTIFY_SCOPES, state, show_dialog: "true" });
  return `${ACCOUNTS}/authorize?${p}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { authorization: "Basic " + Buffer.from(`${clientId()}:${clientSecret()}`).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`spotify token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
}

export async function exchangeCode(code: string) {
  const t = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: spotifyRedirectUri() });
  if (!t.refresh_token) throw new Error("no refresh token returned");
  kvSet("spotify:refresh", t.refresh_token);
  kvSet("spotify:connected_at", new Date().toISOString());
  access = { token: t.access_token, exp: Date.now() + (t.expires_in - 60) * 1000 };
}

export function disconnectSpotify() {
  kvSet("spotify:refresh", null);
  access = null;
}

let access: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string | null> {
  const refresh = kvGet<string | null>("spotify:refresh", null);
  if (!refresh || !spotifyConfigured()) return null;
  if (access && access.exp > Date.now()) return access.token;
  const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: refresh });
  if (t.refresh_token) kvSet("spotify:refresh", t.refresh_token);
  access = { token: t.access_token, exp: Date.now() + (t.expires_in - 60) * 1000 };
  return access.token;
}

async function api<T>(path: string, token: string): Promise<T | null> {
  const res = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/* ---------- shapes the page uses ---------- */

export type Track = { id: string; name: string; artists: string[]; album: string; art: string | null; url: string; durationMs: number };
export type Artist = { id: string; name: string; image: string | null; url: string; genres: string[] };
export type Playlist = { id: string; name: string; description: string; image: string | null; tracks: number; url: string };
export type Range = "short" | "medium" | "long";
export type SpotifyData = {
  topTracks: Record<Range, Track[]>;
  topArtists: Record<Range, Artist[]>;
  recent: Array<{ track: Track; playedAt: string }>;
  playlists: Playlist[];
  fetchedAt: string;
};

type RawTrack = { id: string; name: string; artists: Array<{ name: string }>; album: { name: string; images: Array<{ url: string }> }; external_urls: { spotify: string }; duration_ms: number };
type RawArtist = { id: string; name: string; images: Array<{ url: string }>; external_urls: { spotify: string }; genres: string[] };
type RawPlaylist = { id: string; name: string; description: string; images: Array<{ url: string }> | null; tracks: { total: number }; external_urls: { spotify: string }; public: boolean; owner: { id: string } };

const track = (t: RawTrack): Track => ({ id: t.id, name: t.name, artists: t.artists.map((a) => a.name), album: t.album.name, art: t.album.images?.[1]?.url ?? t.album.images?.[0]?.url ?? null, url: t.external_urls.spotify, durationMs: t.duration_ms });
const artist = (a: RawArtist): Artist => ({ id: a.id, name: a.name, image: a.images?.[1]?.url ?? a.images?.[0]?.url ?? null, url: a.external_urls.spotify, genres: a.genres ?? [] });

const RANGES: Record<Range, string> = { short: "short_term", medium: "medium_term", long: "long_term" };

export async function fetchSpotifyData(): Promise<SpotifyData | null> {
  const token = await accessToken();
  if (!token) return null;
  const me = await api<{ id: string }>("/me", token);

  const topTracks = {} as Record<Range, Track[]>;
  const topArtists = {} as Record<Range, Artist[]>;
  for (const r of Object.keys(RANGES) as Range[]) {
    topTracks[r] = ((await api<{ items: RawTrack[] }>(`/me/top/tracks?time_range=${RANGES[r]}&limit=10`, token))?.items ?? []).map(track);
    topArtists[r] = ((await api<{ items: RawArtist[] }>(`/me/top/artists?time_range=${RANGES[r]}&limit=10`, token))?.items ?? []).map(artist);
  }
  const recent = ((await api<{ items: Array<{ track: RawTrack; played_at: string }> }>("/me/player/recently-played?limit=20", token))?.items ?? []).map((i) => ({ track: track(i.track), playedAt: i.played_at }));
  const playlists = ((await api<{ items: RawPlaylist[] }>("/me/playlists?limit=50", token))?.items ?? [])
    .filter((p) => p.public && (!me || p.owner.id === me.id))
    .map((p) => ({ id: p.id, name: p.name, description: p.description ?? "", image: p.images?.[0]?.url ?? null, tracks: p.tracks.total, url: p.external_urls.spotify }));

  return { topTracks, topArtists, recent, playlists, fetchedAt: new Date().toISOString() };
}

/* ---------- currently playing ---------- */

export type NowPlaying = { playing: boolean; track: Track | null; progressMs: number; fetchedAt: string; device: string | null };

export async function fetchNowPlaying(): Promise<NowPlaying | null> {
  const token = await accessToken();
  if (!token) return null;
  const res = await fetch(`${API}/me/player/currently-playing?additional_types=track`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  const fetchedAt = new Date().toISOString();
  if (res.status === 204 || res.status === 202) return { playing: false, track: null, progressMs: 0, fetchedAt, device: null };
  if (!res.ok) return null;
  const j = (await res.json()) as { is_playing: boolean; progress_ms: number; item: RawTrack | null; currently_playing_type: string; device?: { name?: string } };
  if (!j.item || j.currently_playing_type !== "track") return { playing: false, track: null, progressMs: 0, fetchedAt, device: null };
  return { playing: j.is_playing, track: track(j.item), progressMs: j.progress_ms ?? 0, fetchedAt, device: j.device?.name ?? null };
}
export const getNowPlaying = () => (spotifyConnected() ? cached(SPOTIFY_NOW_KEY, SPOTIFY_NOW_TTL, fetchNowPlaying) : Promise.resolve(null));

export const getSpotifyData = () => (spotifyConnected() ? cached(SPOTIFY_CACHE_KEY, SPOTIFY_TTL, fetchSpotifyData) : Promise.resolve(null));
