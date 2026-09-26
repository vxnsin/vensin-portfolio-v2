import { requireAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { getSpotifyData, spotifyConfigured, spotifyConnected, spotifyRedirectBase, spotifyRedirectUri } from "@/lib/spotify";
import { kvGet } from "@/lib/db";
import { listenStats } from "@/lib/listens";
import { relativeTime } from "@/lib/time";
import { disconnectSpotifyAction, runJobAction } from "../actions";
import { getJobRun } from "@/lib/store";
import { Window } from "@/components/layout/Window";
import { site } from "@/data/site";

export const dynamic = "force-dynamic";

export default async function AdminSpotify({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; hint?: string }> }) {
  await requireAdmin();
  const { ok, error, hint } = await searchParams;
  const h = await headers();
  const currentOrigin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host") ?? ""}`;
  const base = spotifyRedirectBase();
  const wrongHost = currentOrigin !== base;
  const configured = spotifyConfigured();
  const connected = spotifyConnected();
  const connectedAt = kvGet<string | null>("spotify:connected_at", null);
  const data = connected ? await getSpotifyData() : null;
  const log = listenStats();
  const runs = [
    { id: "spotify", label: "top tracks / artists / playlists", run: getJobRun("spotify") },
    { id: "spotify-now", label: "now playing", run: getJobRun("spotify-now") },
  ];

  return (
    <div className="grid gap-4 text-xs">
      <h2 className="pixel text-accent">spotify</h2>
      {ok && <p style={{ color: "var(--ok)" }}>connected ✓ top tracks, artists and playlists are being fetched hourly.</p>}
      {error && <p className="text-[var(--dnd)]">login failed: {error}</p>}
      {(hint === "host" || wrongHost) && configured && !connected && (
        <p className="text-[var(--idle)]">
          the spotify app only knows <code>{base}</code>. open the admin there for the login (you may have to log in again on that host):{" "}
          <a href={`${base}/admin/spotify`}>{base}/admin/spotify</a>
        </p>
      )}

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
                <code>{spotifyRedirectUri()}</code> (current: from SPOTIFY_REDIRECT_BASE, spotify no longer accepts &quot;localhost&quot;)
              </li>
              <li>
                <code>{site.url}/api/spotify/callback</code> (production)
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
            <p>not connected. log in once with your spotify account; only a refresh token is stored, in sqlite. this also enables &quot;now playing&quot; and the listening log without discord.</p>
            <a href="/api/spotify/login" className="btn w-fit no-underline">
              connect spotify →
            </a>
          </div>
        )}
      </Window>

      {connected && (
        <Window title="jobs" dashed>
          <ul className="grid gap-2">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <span className="status-dot shrink-0" style={{ background: !r.run ? "var(--off)" : r.run.ok ? "var(--ok)" : "var(--dnd)", borderWidth: 0 }} />
                <span className="w-56">{r.label}</span>
                <span className="text-ink-soft">{r.run ? `${relativeTime(r.run.at)} · ${r.run.ms} ms` : "never"}</span>
                <form action={runJobAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="btn text-[10px]">
                    fetch now
                  </button>
                </form>
                {r.run?.error && <span className="basis-full text-[var(--dnd)] break-all">{r.run.error}</span>}
              </li>
            ))}
          </ul>
        </Window>
      )}

      <Window title={connected ? "listening log" : "listening log (from discord, no login needed)"} dashed>
        <p>
          {log.minutesTotal} minutes logged since {log.since ? new Date(log.since).toLocaleDateString("de-DE") : "—"}, {log.minutesThisYear} this year across {log.tracksThisYear} tracks.
          {connected ? "one minute per poll while spotify reports something playing." : "the scheduler adds one minute per poll while spotify is playing on discord."}
        </p>
      </Window>
    </div>
  );
}
