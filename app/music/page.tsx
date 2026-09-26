/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { getNowPlaying, getSpotifyData, spotifyConnected } from "@/lib/spotify";
import { SpotifyNow } from "@/components/music/SpotifyNow";
import { listenStats } from "@/lib/listens";
import { relativeTime } from "@/lib/time";
import { Window } from "@/components/layout/Window";
import { NowPlaying } from "@/components/music/NowPlaying";
import { TopTracks } from "@/components/music/TopTracks";
import { ListeningClock } from "@/components/music/ListeningClock";

export const metadata: Metadata = { title: "music" };
export const revalidate = 300;

export default async function MusicPage() {
  const connected = spotifyConnected();
  const [spotify, log, now] = await Promise.all([getSpotifyData(), Promise.resolve(listenStats()), getNowPlaying()]);
  const last = log.lastPlayed ? { song: log.lastPlayed.song, artist: log.lastPlayed.artist, art: log.lastPlayed.art, trackId: log.lastPlayed.trackId, at: log.lastPlayed.at } : null;
  const year = new Date().getFullYear();
  const hours = log.minutesThisYear / 60;
  const topArtist = log.topArtists[0] ?? null;
  const artists = spotify?.topArtists.medium?.length ? spotify.topArtists.medium : spotify?.topArtists.short ?? [];
  const since = log.since ? new Date(log.since).toLocaleDateString("de-DE") : null;

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">music.</h2>
        <p className="text-xs text-ink-soft">what&apos;s in my ears. live from spotify{connected ? "" : " via discord"}, counted by this site since {since ?? "today"}.</p>
      </div>

      <Window title="now playing">
        {connected ? <SpotifyNow initial={now} last={last} variant="hero" /> : <NowPlaying last={last} />}
      </Window>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <Stat value={hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`} label={`listened in ${year}`} />
        <Stat value={String(log.tracksThisYear)} label="different tracks" />
        <Stat value={topArtist ? topArtist.artist : "—"} label="most played artist" small />
        <Stat value={log.minutesThisYear ? `${String(log.byHour.indexOf(Math.max(...log.byHour))).padStart(2, "0")}:00` : "—"} label="favorite hour" />
      </div>

      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <Window title="top tracks" dashed>
          <TopTracks spotify={spotify?.topTracks ?? null} log={log.topTracks} />
        </Window>
        <Window title="listening clock" dashed>
          <ListeningClock byHour={log.byHour} byWeekday={log.byWeekday} />
        </Window>
      </div>

      <Window title={spotify ? "top artists · last 6 months" : "top artists · logged here"} dashed>
        {(spotify ? artists : log.topArtists).length === 0 ? (
          <p className="text-xs text-ink-soft">nothing yet.</p>
        ) : (
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-[11px] text-center">
            {spotify
              ? artists.map((a, i) => (
                  <li key={a.id}>
                    <a href={a.url} target="_blank" rel="noreferrer" className="no-underline group">
                      <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-line group-hover:border-accent">
                        {a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" loading="lazy" /> : null}
                      </div>
                      <div className="mt-1 truncate text-ink group-hover:text-accent">
                        <span className="text-accent-2">{i + 1}</span> {a.name}
                      </div>
                      {a.genres[0] && <div className="text-[9px] text-ink-soft truncate">{a.genres[0]}</div>}
                    </a>
                  </li>
                ))
              : log.topArtists.map((a, i) => (
                  <li key={a.artist}>
                    <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-line">
                      {a.art ? <img src={a.art} alt="" className="w-full h-full object-cover" loading="lazy" /> : null}
                    </div>
                    <div className="mt-1 truncate text-ink">
                      <span className="text-accent-2">{i + 1}</span> {a.artist}
                    </div>
                    <div className="text-[9px] text-ink-soft">{a.minutes} min</div>
                  </li>
                ))}
          </ul>
        )}
      </Window>

      {spotify && spotify.playlists.length > 0 && (
        <Window title="my playlists" dashed>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
            {spotify.playlists.map((p) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer" className="block no-underline group">
                  <div className="aspect-square border border-line bg-paper-2 overflow-hidden">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : null}
                  </div>
                  <div className="mt-1 truncate text-ink group-hover:text-accent">{p.name}</div>
                  <div className="text-[10px] text-ink-soft">{p.tracks} tracks</div>
                </a>
              </li>
            ))}
          </ul>
        </Window>
      )}

      {spotify && spotify.recent.length > 0 && (
        <Window title="recently played" dashed bodyClassName="text-xs">
          <ul>
            {spotify.recent.slice(0, 10).map((r, i) => (
              <li key={`${r.track.id}-${i}`} className="flex items-center gap-3 py-1 border-b border-dashed border-line last:border-0">
                {r.track.art ? <img src={r.track.art} alt="" className="w-8 h-8 object-cover border border-line" loading="lazy" /> : <span className="w-8 h-8" />}
                <a href={r.track.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate no-underline text-ink hover:text-accent">
                  {r.track.name} <span className="text-ink-soft">· {r.track.artists.join(", ")}</span>
                </a>
                <span className="text-[10px] text-ink-soft shrink-0">{relativeTime(r.playedAt)}</span>
              </li>
            ))}
          </ul>
        </Window>
      )}

      <p className="text-[10px] text-ink-soft">
        {spotify ? `top lists and playlists via spotify, refreshed ${relativeTime(spotify.fetchedAt)}. ` : ""}
        hours and the clock come from this site&apos;s own minute-by-minute log, which only counts while spotify shows up on discord. covers via spotify.
      </p>
    </div>
  );
}

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="border border-dashed border-line bg-paper-2 py-2 px-1 min-w-0">
      <div className={`pixel text-accent-2 truncate ${small ? "text-base" : "text-2xl"}`} title={value}>
        {value}
      </div>
      <div className="text-[10px] text-ink-soft">{label}</div>
    </div>
  );
}
