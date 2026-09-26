# vensin.dev v2

My personal site, rebuilt from scratch. A cozy old-web layout with anime energy, live Discord presence, a photo/video gallery, a contact form that pings me on Discord, Apple Watch rings in the sidebar, and a small admin panel. Mobile friendly.

## Stack

- Next.js 16 (App Router, server actions) + TypeScript
- Tailwind CSS v4 with theme tokens (day / night)
- Lanyard (WebSocket + REST fallback) for the Discord widget and the "latest" box
- Kitsu for anime posters, aniworld.to profile for recently watched
- Open-Meteo for the weather page (coords server-side only)
- Upstash Redis **or** a JSON file for content, Vercel Blob **or** a local folder for uploads
- sharp + heic-convert for image processing (HEIC → JPEG → WebP)
- Fonts: DotGothic16 (pixel / headings) + IBM Plex Mono (body)

## Run

```bash
npm install
cp .env.example .env.local   # fill in what you need
npm run dev
```

Without any env vars the site still runs: content falls back to `.data/store.json`, uploads go to `public/uploads`, the admin panel and weather page stay disabled.

## Pages

| Route | What |
| --- | --- |
| `/` | intro, update log, latest GitHub activity |
| `/about` | bio, stats, tech stack |
| `/projects` | project cards with filters |
| `/anime` | recently watched + favorites |
| `/gallery` | photos & videos with tags + lightbox |
| `/links` | socials |
| `/contact` | contact form → Discord DM + admin inbox |
| `/impressum` | legal |
| `/admin` | login-protected panel: messages, uploads, update log, marquee |

## Sidebar widgets

- **discord** – live presence (Spotify, games, YouTube/AniWorld with progress bar).
- **today** – three pages that cycle: date, weather, Apple Watch rings (Tokyo time until the first ring sync).
- **latest** – what's running now, otherwise the last game / video / song. Visitors' browsers ping `/api/latest`, the server asks Lanyard and remembers it.

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
| Impressum | `app/impressum/page.tsx` |
| Colors / box styles | `app/globals.css` |

## Deploy

**Vercel:** import the repo, add Upstash Redis + Blob from Storage, set the env vars from `.env.example`. Note: Vercel limits request bodies to ~4.5 MB, so big uploads only work self-hosted.

**Raspberry Pi (planned):**

```bash
npm ci && npm run build
DATA_DIR=/var/lib/vensin UPLOAD_DIR=/var/lib/vensin/uploads npm start
```

Put it behind a Cloudflare Tunnel; the JSON store and the upload folder are persistent on disk, no Redis or Blob needed. Serve `UPLOAD_DIR` at `/uploads` (symlink into `public/uploads` or a reverse-proxy rule).
