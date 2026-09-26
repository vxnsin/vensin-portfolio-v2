import { requireAdmin } from "@/lib/auth";
import { getSpotifyData, spotifyConfigured, spotifyConnected, spotifyRedirectUri } from "@/lib/spotify";
import { kvGet } from "@/lib/db";
import { listenStats } from "@/lib/listens";
import { relativeTime } from "@/lib/time";
import { disconnectSpotifyAction } from "../actions";
import { Window } from "@/components/layout/Window";
import { site } from "@/data/site";

export const dynamic = "force-dynamic";

export default async function AdminSpotify({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const configured = spotifyConfigured();
  const connected = spotifyConnected();
  const connectedAt = kvGet<string | null>("spotify:connected_at", null);
  const data = connected ? await getSpotifyData() : null;
  const log = listenStats();

  return (
    <div className="grid gap-4 text-xs">
      <h2 className="pixel text-accent">spotify</h2>
      {ok && <p style={{ color: "var(--ok)" }}>connected ✓ top tracks, artists and playlists are being fetched hourly.</p>}
      {error && <p className="text-[var(--dnd)]">login failed: {error}</p>}

      <Window title="account" dashed>
        {!configured ? (
          <div className="grid gap-2">
            <p>
              set <span className="chip">SPOTIFY_CLIENT_ID</span> and <span className="chip">SPOTIFY_CLIENT_SECRET</span> first. create an app at{" "}
              <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">
                developer.spotify.com
              </a>{" "}
              and add these redirect uris:
            </p>
            <ul className="list-disc pl-4">
              <li>
                <code>{spotifyRedirectUri("http://127.0.0.1:3000")}</code> (local dev, spotify no longer accepts &quot;localhost&quot;)
              </li>
              <li>
                <code>{spotifyRedirectUri(site.url)}</code>
              </li>
            </ul>
          </div>
        ) : connected ? (
          <div className="grid gap-2">
            <p>
              connected {connectedAt ? relativeTime(connectedAt) : ""}. data last fetched {data ? relativeTime(data.fetchedAt) : "never"}.
              {data && ` ${data.topTracks.short.length} top tracks · ${data.topArtists.short.length} top artists · ${data.playlists.length} public playlists · ${data.recent.length} recent`}
            </p>
            <div className="flex gap-2">
              <a href="/api/spotify/login" className="btn text-[11px] no-underline">
                reconnect
              </a>
              <form action={disconnectSpotifyAction}>
                <button type="submit" className="btn text-[11px]" style={{ color: "var(--dnd)" }}>
                  disconnect
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            <p>not connected. log in once with your spotify account; only a refresh token is stored, in sqlite.</p>
            <a href="/api/spotify/login" className="btn w-fit no-underline">
              connect spotify →
            </a>
          </div>
        )}
      </Window>

      <Window title="listening log (from discord, no login needed)" dashed>
        <p>
          {log.minutesTotal} minutes logged since {log.since ? new Date(log.since).toLocaleDateString("de-DE") : "—"}, {log.minutesThisYear} this year across {log.tracksThisYear} tracks.
          the scheduler adds one minute per poll while spotify is playing on discord.
        </p>
      </Window>
    </div>
  );
}
