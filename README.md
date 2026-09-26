# vensin.dev v2

My personal site, rebuilt from scratch. A cozy old-web layout with anime energy, live Discord presence, a photo/video gallery, a contact form that pings me on Discord, Apple Watch rings in the sidebar, and a small admin panel. Mobile friendly.

## Stack

- Next.js 16 (App Router, server actions) + TypeScript
- Tailwind CSS v4 with theme tokens (day / night)
- Lanyard (WebSocket + REST fallback) for the Discord widget and the "latest" box
- Kitsu for anime posters, aniworld.to profile for recently watched
- Open-Meteo for the weather page (coords server-side only)
- SQLite (better-sqlite3) for all content plus a cache of external data; a local folder (or Vercel Blob) for uploads
- In-process scheduler that keeps the cache warm (GitHub, Discord, weather, anime)
- sharp + heic-convert for image processing (HEIC → JPEG → WebP)
- Fonts: DotGothic16 (pixel / headings) + IBM Plex Mono (body)
- Icons: [pixelarticons](https://pixelarticons.com) (MIT) for weather and platform logos, Steam mark from [Pixel Art Icons by YukiPixels](https://github.com/YukiPixels/Pixel-Art-Icons) (CC BY-SA 4.0)

## Run

```bash
npm install
cp .env.example .env.local   # fill in what you need
npm run dev
```

Without any env vars the site still runs: everything is stored in `.data/vensin.sqlite`, uploads go to `public/uploads`, the admin panel and weather page stay disabled.

## Data & background jobs

One SQLite file (`DATA_DIR/vensin.sqlite`) holds messages, gallery, favorites, update log, marquee, ring data, the "latest" box, and a `cache` table for everything fetched from outside. Pages only read from SQLite, so nothing is fetched from GitHub or Kitsu on a page view.

The scheduler (`lib/jobs.ts`, started from `instrumentation.ts`) refreshes:

| job | schedule |
| --- | --- |
| discord latest activity | every minute |
| spotify now playing (feeds the sidebar, the log and the latest box) | every 30 s |
| weather | every 10 min |
| github latest commit | every hour |
| anime recently watched | every hour |
| github followers & repos | daily 00:00 |
| github contribution graph | daily 00:05 |

Every job can be triggered from the admin dashboard ("run now"). On a serverless host the scheduler is off and the cache is refreshed on demand when a value expires. Set `SCHEDULER=off` to disable it.

## Pages

| Route | What |
| --- | --- |
| `/` | intro, update log, latest GitHub activity |
| `/about` | bio, stats, tech stack |
| `/projects` | project cards with filters |
| `/anime` | recently watched + favorites |
| `/music` | now playing, hours listened, top tracks/artists, playlists, listening clock |
| `/gallery` | photos & videos with tags + lightbox |
| `/links` | socials, neighbors (88x31 buttons), link-back button |
| `/contact` | contact form → Discord DM + admin inbox |
| `/impressum` | forwards to the external impressum service (`IMPRESSUM_URL`) |
| `/privacy` | Datenschutzerklärung |
| `/admin` | login-protected panel: messages, uploads, favorites, update log, marquee, maintenance mode |

## Maintenance mode

`/admin/maintenance` switches the whole public site to a standalone "under maintenance" page (HTTP 503, noindex). Turning it on or off asks for the admin password again. Logged-in admins keep seeing the real site. Implemented in `proxy.ts`, which runs in the Node runtime and reads the flag from SQLite.

## Sidebar widgets

- **discord** – live presence (Spotify, games, YouTube/AniWorld with progress bar).
- **today** – three pages that cycle: date, weather, Apple Watch rings (Tokyo time until the first ring sync).
- **latest** – what's running now, otherwise the last game / video / song. Visitors' browsers ping `/api/latest`, the server asks Lanyard and remembers it.

## Discord widget: adding a service

Every activity is rendered from a small handler in `components/discord/activities/` (`match` + `info`). Built in: Spotify, editors (VSCord), anime (AniWorld), YouTube, GitHub, generic browsing (PreMiD), games. To add one, create `activities/<name>.ts` exporting an `ActivityHandler` and register it in `activities/index.ts` above the fallbacks. Unknown PreMiD sites are shown as "browsing" and the server DMs you the raw payload once, so you know what to match on.

## Anime favorites

Managed in `/admin/anime`: type a title, pick a suggestion from Kitsu, add a short note and your own rating. The anime page shows six at a time and flips through pages automatically. Until the list has entries, the seed list from `data/anime.ts` is shown.

## Music page

Two sources, both optional:

- **Listening log**: while Spotify is connected, a 30-second poll of the Spotify API ("currently playing") writes one row per minute; without it, the Discord poll does the same whenever Spotify shows up there. That gives hours per year, most played tracks/artists, and the listening clock. Starts counting the moment the scheduler runs.
- **Spotify API** (top tracks/artists per time range, recently played, public playlists): create an app on developer.spotify.com, set `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`, add the redirect URIs `http://127.0.0.1:3000/api/spotify/callback` and `https://vensin.dev/api/spotify/callback`, then click "connect spotify" in `/admin/spotify`. Only the refresh token is stored (SQLite); a job refreshes the data hourly.
- **History import** (real yearly stats): request your data export in Spotify's privacy settings, unzip it and upload the `StreamingHistory_music_*.json` / `Streaming_History_Audio_*.json` files in `/admin/spotify`. Plays under 30 s are ignored, overlaps with the live import are skipped.

## Neighbors & link back

`/admin/neighbors` manages the 88x31 buttons of friends' sites (image URL or upload). The own button lives at `/button.png` (`/button@2x.png`, `/button.svg`); the links page shows the HTML snippet to copy.

## Apple Watch rings

`POST /api/health` with `Authorization: Bearer <HEALTH_TOKEN>` and a JSON body:

```json
{ "move": 420, "exercise": 25, "stand": 9, "steps": 6800 }
```

Goals default to the `HEALTH_*_GOAL` env vars and can be overridden per request (`moveGoal`, `exerciseGoal`, `standGoal`).

iPhone setup (Shortcuts app):

1. New shortcut. Add **Find Health Samples** three times: *Active Energy* (today, sum), *Exercise Minutes* (today, sum), *Stand Hours* (today, sum). Optionally *Steps*.
2. Add **Dictionary** with keys `move`, `exercise`, `stand`, `steps` and the values from step 1.
3. Add **Get Contents of URL**: `https://vensin.dev/api/health`, method POST, header `Authorization: Bearer <token>`, request body JSON = the dictionary.
4. Automation → Time of Day (e.g. every 2 hours) → run the shortcut, "Run immediately" enabled.

## Gallery uploads

Photos are rotated by EXIF, resized to max 2200px and saved as WebP. HEIC/HEIF from iPhone is converted automatically. GIFs stay GIFs. Videos (mp4, mov, webm) are stored as-is; mp4/H.264 plays everywhere, HEVC `.mov` does not play in every browser.

## Where to edit content

| What | Where |
| --- | --- |
| Name, intro, typewriter, socials, nav, seed texts | `data/site.ts` |
| Projects | `data/projects.ts` (thumbnails in `public/projects/thumbnails`) |
| Tech stack | `data/techstack.ts` (icons in `public/icons`) |
| Favorite anime (by MAL id) + aniworld profile | `data/anime.ts` |
| Update log, marquee, photos, messages | `/admin` |
| Impressum | external service, `IMPRESSUM_URL` in `.env.local` |
| Privacy policy | `app/privacy/page.tsx` |
| Colors / box styles | `app/globals.css` |

## Deploy

**Raspberry Pi (the plan):**

```bash
npm ci && npm run build
DATA_DIR=/var/lib/vensin UPLOAD_DIR=/var/lib/vensin/uploads npm start
```

Put it behind a Cloudflare Tunnel. The SQLite file and the upload folder are persistent on disk, the scheduler runs inside the Node process. Serve `UPLOAD_DIR` at `/uploads` (symlink into `public/uploads` or a reverse-proxy rule).

**Vercel** works too, but the SQLite file lives in `/tmp` there (not persistent) and the scheduler does not run. Fine for previews, not for the real thing.
