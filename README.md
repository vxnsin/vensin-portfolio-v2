# vensin.dev v2 「sakura」

My personal site, rebuilt from scratch. A cozy old-web / nekoweb-style layout with anime energy, live Discord presence and mobile support.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 with theme tokens (light "day" / dark "night")
- Lanyard (WebSocket + REST fallback) for the live Discord widget
- Jikan (MyAnimeList) for anime covers, aniworld.to profile for recently watched
- Fonts: DotGothic16 (pixel / headings) + IBM Plex Mono (body)

## Run

```bash
npm install
npm run dev
```

## Where to edit content

| What | File |
| --- | --- |
| Name, intro text, "now" box, update log, marquee, socials, nav | `data/site.ts` |
| Projects | `data/projects.ts` (thumbnails in `public/projects/thumbnails`) |
| Tech stack | `data/techstack.ts` (icons in `public/icons`) |
| Favorite anime (by MAL id) + aniworld profile | `data/anime.ts` |
| Impressum | `app/impressum/page.tsx` |
| Colors / box styles | `app/globals.css` |

No environment variables are required.
