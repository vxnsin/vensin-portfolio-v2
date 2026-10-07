<!-- cozy:cards -->
<div align="center">

<a href="https://vensin.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/header-dark.svg?v=47646b3344"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/header-light.svg?v=47646b3344" width="840" alt="vensin.dev · ヴェンシン · v2 · a cozy old-web corner · an anime enthusiast · live from my discord · home of mochi the cat"></picture></a>

<a href="https://vensin.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/nav-site-dark.svg?v=65d047b3cd"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/nav-site-light.svg?v=65d047b3cd" width="154" alt="visit vensin.dev →"></picture></a><a href="https://vensin.dev/guestbook"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/nav-guestbook-dark.svg?v=38b0bb3925"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/nav-guestbook-light.svg?v=38b0bb3925" width="147" alt="sign the guestbook"></picture></a><a href="https://vensin.dev/mochi"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/nav-mochi-dark.svg?v=f1a8cd686f"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/nav-mochi-light.svg?v=f1a8cd686f" width="128" alt="play with mochi"></picture></a>

<a href="https://github.com/vxnsin/vensin-portfolio-v2"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/repo-dark.svg?v=0932a6fd29"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/repo-light.svg?v=0932a6fd29" width="840" alt="vxnsin/vensin-portfolio-v2: vensin.dev v2 - cozy old-web portfolio with anime energy and live Discord presence"></picture></a>

<a href="https://github.com/vxnsin/vensin-portfolio-v2/commits"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/commits-dark.svg?v=a304e154d6"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/commits-light.svg?v=a304e154d6" width="840" alt="latest commits of vxnsin/vensin-portfolio-v2"></picture></a>

<a href="https://github.com/vxnsin/vensin-portfolio-v2/graphs/contributors"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/contributors-dark.svg?v=4849c3446c"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/contributors-light.svg?v=4849c3446c" width="840" alt="contributors: vxnsin"></picture></a>

</div>
<!-- /cozy:cards -->

<div align="center">

**My little corner of the internet: old-web layout, anime energy, and a sidebar that shows what I'm doing right now.**

[![vensin.dev](https://img.shields.io/badge/vensin.dev-visit-c4381f?labelColor=2b2420)](https://vensin.dev)
[![Next.js](https://img.shields.io/badge/next.js-16-ece1cf?labelColor=2b2420&logo=nextdotjs&logoColor=ece1cf)](https://nextjs.org)
[![React](https://img.shields.io/badge/react-19-7fb8e0?labelColor=2b2420&logo=react&logoColor=7fb8e0)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178c6?labelColor=2b2420&logo=typescript&logoColor=7fb8e0)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/tailwind-4-3d7a4b?labelColor=2b2420&logo=tailwindcss&logoColor=7cc68d)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/sqlite-one_file-a87fe0?labelColor=2b2420&logo=sqlite&logoColor=c9b3ef)](https://sqlite.org)

</div>

vensin.dev v2 is my personal site, rebuilt from scratch: pixel fonts, little windows, a starry
sky and a pixel cat called mochi who lives in the sidebar. Everything on it is live. The Discord
window shows what I'm coding, watching or listening to, the music page counts every Spotify
play, the anime page logs every episode, and my Apple Watch rings close (or don't) in public.

| | |
| --- | --- |
| **Live sidebar** | Discord presence with handlers for Spotify, VS Code, anime, YouTube and games, a "today" window, Apple Watch rings, and mochi reacting to all of it |
| **Music** | now playing with synced lyrics, a listening log with yearly stats, top tracks and artists, a listening clock |
| **Anime** | watched and watchlist shelves, a watch log with weekly bars, finished-season badges |
| **Seasons** | the whole site changes with the calendar, with specials for christmas, new year, halloween, valentine's day and april fools |
| **Guestbook & contact** | spam screening, Discord cards with approve and reject buttons |
| **Mochi clicker** | an idle game with a shop, upgrades, golden mochi and nine lives |
| **Admin panel** | every text, project, photo and season is editable without touching code |

Mobile friendly, no tracking cookies, and one SQLite file holds everything.

## Contents

- **Setup:** [Stack](#stack) · [Run](#run) · [Data & background jobs](#data--background-jobs) · [Pages](#pages) · [Deploy](#deploy) · [Where to edit content](#where-to-edit-content)
- **Features:** [Sidebar widgets](#sidebar-widgets) · [Discord widget](#discord-widget-adding-a-service) · [Music page](#music-page) · [Seasons](#seasons) · [Guestbook](#guestbook--discord-buttons) · [Apple Watch rings](#apple-watch-rings) · [Watch log](#watch-log) · [Pixel cat](#pixel-cat)
- **Running it safely:** [Abuse limits](#abuse-limits) · [Backups](#backups) · [Maintenance mode](#maintenance-mode)

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
| `/setup` | desk, computer, audio, motorcycle, everyday carry: what's actually in use, edited in the admin |
| `/links` | socials, neighbors (88x31 buttons), link-back button |
| `/contact` | contact form → Discord DM + admin inbox (two messages a day per sender) |
| `/guestbook` | public guestbook with spam screening; flagged entries wait for a Discord button click or the admin |
| `/impressum` | forwards to the external impressum service (`IMPRESSUM_URL`) |
| `/privacy` | Datenschutzerklärung |
| `/admin` | login-protected panel: messages, guestbook, uploads, projects, favorites, seasons, update log, marquee, maintenance mode |

## Maintenance mode

The maintenance page has a folded "owner?" form at the bottom: enter the admin password there and you land on the real site with a session cookie, without ever opening `/admin` (five tries per ten minutes per ip).

`/admin/maintenance` switches the whole public site to a standalone "under maintenance" page (HTTP 503, noindex). Turning it on or off asks for the admin password again. Logged-in admins keep seeing the real site. Implemented in `proxy.ts`, which runs in the Node runtime and reads the flag from SQLite.

## Sidebar widgets

- **discord** – live presence (Spotify, games, YouTube/AniWorld with progress bar).
- **today** – three pages that cycle: date, weather, Apple Watch rings (Tokyo time until the first ring sync).
- **latest** – what's running now, otherwise the last game / video / song. Visitors' browsers ping `/api/latest`, the server asks Lanyard and remembers it.

## Discord widget: adding a service

Every activity is rendered from a small handler in `components/discord/activities/` (`match` + `info`). Built in: Spotify, editors (VSCord), anime (AniWorld), YouTube, GitHub, generic browsing (PreMiD), games. To add one, create `activities/<name>.ts` exporting an `ActivityHandler` and register it in `activities/index.ts` above the fallbacks. Unknown PreMiD sites are shown as "browsing" and the server sends you the raw payload once (to `DISCORD_ACTIVITY_CHANNEL_ID` if set, otherwise as a DM), so you know what to match on.

## Anime favorites

Managed in `/admin/anime`: type a title, pick a suggestion from Kitsu, add a short note and your own rating. The anime page shows six at a time and flips through pages automatically. Until the list has entries, the seed list from `data/anime.ts` is shown.

## Music page

Two sources, both optional:

- **Live now playing**: Spotify has no push api for "what am I listening to", so a small in-process watcher (`lib/spotify-live.ts`) polls smartly: while a track plays it asks again right when that track should end (12 s at most), idle every 20 s. Changes are pushed to browsers over server-sent events (`/api/spotify/stream`); the sidebar and the music page also ask for a fresh look the moment a track runs out or discord reports a different one. On hosts without a long-lived process the browser falls back to polling.
- **Lyrics**: the music page types the current lyric line along with the track. Synced lyrics come from [LRCLIB](https://lrclib.net) (open, no key), fetched server-side (`lib/lyrics.ts`, `/api/lyrics?id=<track>`) and cached for a month; the browser only ever talks to this site. Tracks without synced lyrics say so, instrumentals too.
- **Listening log**: while Spotify is connected, a 30-second poll of the Spotify API ("currently playing") writes one row per minute; without it, the Discord poll does the same whenever Spotify shows up there. That gives hours per year, most played tracks/artists, and the listening clock. Starts counting the moment the scheduler runs.
- **Spotify API** (top tracks/artists per time range, recently played, public playlists): create an app on developer.spotify.com, set `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`, add the redirect URIs `http://127.0.0.1:3000/api/spotify/callback` and `https://vensin.dev/api/spotify/callback`, then click "connect spotify" in `/admin/spotify`. Only the refresh token is stored (SQLite); a job refreshes the data hourly.
- **History import** (real yearly stats): request your data export in Spotify's privacy settings, unzip it and upload the `StreamingHistory_music_*.json` / `Streaming_History_Audio_*.json` files in `/admin/spotify`. Plays under 30 s are ignored, overlaps with the live import are skipped.

## Seasons

The palette, the window frames and the particles follow the calendar (`lib/season.ts`): spring (sakura petals), summer (fireflies, sunny stripes), autumn (tumbling leaves), winter (pixel snow with snow caps on every window), and from Dec 18 to 27 a christmas special that visitors can't pick themselves: santa's sleigh with two reindeer crosses the sky, presents tumble down between the snow, fairy lights run along every title bar, and santa has "just signed" the guestbook at the top of page one (rendered, not stored). Halloween (Oct 15 – Nov 2: ghosts, bats, a cobweb) is a special too. Two more specials: new year (Dec 31 – Jan 1, fireworks and gold dust, "happy new year" under the title) Luis' birthday (Apr 10, confetti, balloons, "it's my birthday today!"), valentine's day (Feb 14, pixel hearts) and april fools (Apr 1: question marks rain down, the title and the tab title hang upside down, the tabs wobble, the marquee runs backwards, the cursor is a rubber duck, buttons dodge the mouse once, the date says march 32nd, the tagline talks nonsense, a chocolate-chip cookie banner shows up, a fake update gets stuck at 99 %, a flashing "You are an idiot!" window bounces around after half a minute and closing it spawns two more, and the website signs its own guestbook). `/admin/seasons` shows every look with dates, texts, a live preview (`/?season=<name>`, honoured only for a logged-in admin) and a pin button. Special days also get a personal note on the home page (`seasonNote` in `lib/season-data.ts`). Light and dark mode each have their own set. Visitors can pick a season in the footer (cookie `season`, "auto" removes it); on special days the picker is locked and the cookie is ignored. `/admin/seasons` sets the default for everyone else.

## Abuse limits

Everything public has a ceiling, all in-memory per process (`lib/ratelimit.ts`), on top of whatever Cloudflare does in front:

| what | limit |
|---|---|
| page requests (proxy) | 120 per 30 s per ip → 429; public POST bodies over 2 MB → 413 |
| admin login, maintenance unlock | 5 tries per 10 min per ip, a wrong password costs a second |
| contact form | 2 messages per 24 h per hashed ip (counted in sqlite) |
| guestbook | 1 entry per 5 min, 5 per day per hashed ip, honeypot, word filters |
| pokes | 1 per second, 40 per minute per ip |
| now playing / lyrics / visits / latest | 120 / 30 / 60 / 10 per minute per ip |
| event stream | 200 open streams overall, 4 per ip |
| visitor counter | at most 3 new "people" per ip per day |

Admin-only routes check the session cookie, the health endpoint its bearer token, the Discord endpoint the Ed25519 signature and the owner id. All sql goes through prepared statements, uploads are re-encoded by sharp and stored under random names, react escapes everything it renders.

## Backups

Every night at 03:30 the scheduler takes a consistent copy of the sqlite file (sqlite's online backup, safe while the site runs), gzips it into `<DATA_DIR>/backups/` and keeps the last `BACKUP_KEEP` (default 14). With `DISCORD_BACKUP_CHANNEL_ID` (bot) or `DISCORD_BACKUP_WEBHOOK_URL` set, the copy also goes off-site, so a dead SD card on the pi is a five-minute problem:

- `BACKUP_UPLOAD=discord` (default): the .sqlite.gz is attached to a message in that private channel.
- `BACKUP_UPLOAD=catbox`: the file is encrypted (aes-256-gcm, key derived from `BACKUP_PASSPHRASE` with scrypt), uploaded to [catbox.moe](https://catbox.moe) (`CATBOX_USERHASH` optional) and only the link plus a checksum is posted to the channel. Catbox links are public, so this mode refuses to run without a passphrase; if catbox is down the encrypted file is attached to the message instead. `node scripts/decrypt-backup.mjs <file.enc> <passphrase>` turns it back into the .sqlite.gz.

`/admin` lists the local copies and has a "backup now" button.

**Restore:** stop the site, `gunzip` the file, place it as `<DATA_DIR>/vensin.sqlite`, delete `vensin.sqlite-wal` and `vensin.sqlite-shm` if they exist, start the site. Gallery uploads live in `public/uploads` (or Vercel Blob) and are not part of the backup.

## Guestbook & Discord buttons

Entries that pass the screening (`lib/guestbook.ts`: no links, no spam words, not all caps, not a repeat, honeypot empty, rate limit per hashed IP) go straight to the wall. Anything flagged is stored as `pending` and only shows up after approval; slurs, keyboard mashing and honeypot hits are dropped silently, but a "blocked" card with the sender's IP and user agent goes to the guestbook channel so repeat offenders are easy to spot. Those cards are deleted again after `BLOCKED_RETENTION_DAYS` (default 14) by a nightly job, which is what the privacy policy promises.

Flagged entries and every contact message are sent to your Discord DMs as a components-v2 card with buttons; entries that passed every filter go to `DISCORD_GUESTBOOK_CHANNEL_ID` (or `DISCORD_GUESTBOOK_WEBHOOK_URL`) instead, so your DMs only hold what needs a decision (approve / reject / take down / delete, mark read). For the buttons to work Discord has to reach the site:

1. In the [developer portal](https://discord.com/developers/applications) copy the app's **Public Key** into `DISCORD_PUBLIC_KEY`.
2. Set **Interactions Endpoint URL** to `https://vensin.dev/api/discord/interactions` (Discord sends a signed ping and only saves the url when it answers).
3. Buttons only react to `DISCORD_OWNER_ID`; everyone else gets a polite "not for you".

Without the public key the cards still arrive, the buttons just do nothing; `/admin/guestbook` works either way.

## Neighbors & link back

`/admin/neighbors` manages the 88x31 buttons of friends' sites (image URL or upload). The own button lives at `/button.png` (`/button@2x.png`, `/button.svg`); the links page shows the HTML snippet to copy.

## Apple Watch rings

`POST /api/health` with `Authorization: Bearer <HEALTH_TOKEN>` and a JSON body:

```json
{ "move": 420, "exercise": 25, "stand": 9, "steps": 6800, "goals": { "move": 500, "exercise": 30, "stand": 12 } }
```

`goals` is optional; missing goals fall back to the `HEALTH_*_GOAL` env vars. The older flat form (`moveGoal`, `exerciseGoal`, `standGoal`) still works. Values may arrive as numbers or as Health strings like `"512,3 kcal"`, units and decimal commas are handled.

iPhone setup (Shortcuts app):

1. New shortcut. Add **Find Health Samples** three times: *Active Energy* (today, sum), *Exercise Minutes* (today, sum), *Stand Hours* (today, sum). Optionally *Steps*.
2. Add **Dictionary** with keys `move`, `exercise`, `stand`, `steps` and the values from step 1.
3. Add **Get Contents of URL**: `https://vensin.dev/api/health`, method POST, header `Authorization: Bearer <token>`, request body JSON = the dictionary.
4. Automation → Time of Day (e.g. every 2 hours) → run the shortcut, "Run immediately" enabled.

## Gallery uploads

Photos are rotated by EXIF, resized to max 2200px and saved as WebP. HEIC/HEIF from iPhone is converted automatically. GIFs stay GIFs. Videos (mp4, mov, webm) are stored as-is; mp4/H.264 plays everywhere, HEVC `.mov` does not play in every browser.

## Visitor counter

The footer odometer counts one visit per person per day: the proxy hashes ip + user agent + day (salted), inserts it into a small table (rows older than two days are dropped) and bumps a lifetime total in kv. No cookies, nothing that links days together.

## Anime lists

`aniworld.to/user/profil/<name>/subscribed` is treated as "watched" and `/watchlist` as "not yet"; a daily job scrapes both (titles + links), posters come from Kitsu (cached per title for a week) and the anime page shows both shelves folded to twelve posters.

## Watch log

Every episode the hourly "recently watched" scrape sees is written to `anime_log` once. The anime page turns that into "this week / month / year", a year of weekly pixel bars and a "finished lately" row: a season counts as finished when the last logged episode equals the season's episode count (read from the series page, cached a week); those shows also get a "✓ done" badge on the shelf. A daily job also pulls the profile's whole watched history (about a thousand episodes, no dates) into the log with the "imported" flag: they count in totals and finished checks, not in the weekly bars. The profile page only lists the last thousand episodes, so the "all time" number comes from the profile header instead (refreshed every six hours).

## Pixel cat

"mochi" in the sidebar reacts to the Discord status: asleep when idle or offline, taps away while coding, bops while music plays, wide-eyed during anime, purrs when clicked. Frames are pixel grids in `components/widgets/Pet.tsx`; pokes are counted in kv through `/api/pet`.

## Icons

`app/icon.tsx` and `app/apple-icon.tsx` draw mochi's face (`lib/cat-face.ts`) as the tab icon and the iphone home screen icon; the home page's social card carries her too.

## Social previews

Every main page has its own Open Graph image (`app/*/opengraph-image.tsx`, shared card in `lib/og.tsx`): the music card shows the current track, anime the latest posters, projects the count, guestbook the newest signature.

## About page

`/admin/about` edits every word on `/about`: intro paragraphs, what you're learning, a jar of quotes (a random one per page load), likes, dislikes and "ask me about" chips (`lib/about.ts` holds the defaults). The page adds a "right now" box from the live data (listening, watching, coding, playing) and the tech stack.

## Projects

`/admin/projects` adds, edits, reorders and deletes projects (name, tagline, description, tech, years, status, role, highlights, links, thumbnail by url or upload). They live in sqlite; `data/projects.ts` only seeds an empty database. A project with a GitHub link and no thumbnail gets the repo's social image automatically.

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
