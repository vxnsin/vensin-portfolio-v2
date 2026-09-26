# vensin.dev v2

My personal site, rebuilt from scratch. A cozy old-web layout with anime energy, live Discord presence, a photo gallery, a contact form that pings me on Discord, and a small admin panel. Mobile friendly.

## Stack

- Next.js 16 (App Router, server actions) + TypeScript
- Tailwind CSS v4 with theme tokens (day / night)
- Lanyard (WebSocket + REST fallback) for the live Discord widget and the "now" box
- Kitsu for anime posters, aniworld.to profile for recently watched
- Open-Meteo for the weather page (coords server-side only)
- Upstash Redis for content (messages, gallery list, update log, marquee), Vercel Blob for photos
- Fonts: DotGothic16 (pixel / headings) + IBM Plex Mono (body)

## Run

```bash
npm install
cp .env.example .env.local   # then fill in what you need
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
| `/gallery` | photos with tags + lightbox |
| `/links` | socials |
| `/contact` | contact form → Discord DM + admin inbox |
| `/impressum` | legal (fill in!) |
| `/admin` | login-protected panel: messages, gallery upload, update log, marquee, now-box texts |

## Where to edit content

| What | Where |
| --- | --- |
| Name, intro, typewriter, socials, nav, seed texts | `data/site.ts` |
| Projects | `data/projects.ts` (thumbnails in `public/projects/thumbnails`) |
| Tech stack | `data/techstack.ts` (icons in `public/icons`) |
| Favorite anime (by MAL id) + aniworld profile | `data/anime.ts` |
| Update log, marquee, now-box fallbacks, photos, messages | `/admin` |
| Impressum | `app/impressum/page.tsx` |
| Colors / box styles | `app/globals.css` |

## Deploy (Vercel)

1. Import the repo.
2. Storage → add **Upstash Redis** and **Blob** (both inject their env vars automatically).
3. Add `ADMIN_PASSWORD`, `WEATHER_LAT`/`WEATHER_LON`, and either `DISCORD_BOT_TOKEN` (DM) or `DISCORD_WEBHOOK_URL` (channel). See `.env.example`.
