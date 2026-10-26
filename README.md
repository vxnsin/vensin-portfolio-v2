<!-- cozy:cards -->
<div align="center">

<a href="https://vensin.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/header-dark.svg?v=47646b3344"><img src="https://raw.githubusercontent.com/vxnsin/vensin-portfolio-v2/output/header-light.svg?v=47646b3344" width="840" alt="vensin.dev · ヴェンシン · v2 · a cozy old-web corner · an anime enthusiast · live from my discord · home of mochi the cat"></picture></a>

</div>
<!-- /cozy:cards -->

**My little corner of the internet, take two.**

[![vensin.dev][b-site]][site] [![Next.js][b-next]][next] [![React][b-react]][react] [![TypeScript][b-ts]][ts] [![Tailwind CSS][b-tw]][tw] [![SQLite][b-sqlite]][sqlite]

[site]: https://vensin.dev
[next]: https://nextjs.org
[react]: https://react.dev
[ts]: https://www.typescriptlang.org
[tw]: https://tailwindcss.com
[sqlite]: https://sqlite.org
[b-site]: https://img.shields.io/badge/vensin.dev-visit-c4381f?labelColor=2b2420
[b-next]: https://img.shields.io/badge/next.js-16-ece1cf?labelColor=2b2420&logo=nextdotjs&logoColor=ece1cf
[b-react]: https://img.shields.io/badge/react-19-7fb8e0?labelColor=2b2420&logo=react&logoColor=7fb8e0
[b-ts]: https://img.shields.io/badge/typescript-5-3178c6?labelColor=2b2420&logo=typescript&logoColor=7fb8e0
[b-tw]: https://img.shields.io/badge/tailwind-4-3d7a4b?labelColor=2b2420&logo=tailwindcss&logoColor=7cc68d
[b-sqlite]: https://img.shields.io/badge/sqlite-one_file-a87fe0?labelColor=2b2420&logo=sqlite&logoColor=c9b3ef

## What is this?

This is the second version of my personal site. The first one was fine, but it felt like every other portfolio: a hero, three cards, a footer. I wanted something with more personality, so I threw it away and started over with the old web in mind. Small windows, pixel fonts, a marquee, 88x31 buttons from friends' sites, a guestbook, a visitor counter. A cozy little place with a bit of anime energy on top.

It's also a bit alive. The sidebar shows what I'm doing on Discord right now, whether that's coding, listening to something or watching an episode. There's a music page that follows my Spotify, an anime page with what I watched lately, and a gallery for photos and videos. A pixel cat called Mochi lives in the sidebar and reacts to all of it: she sleeps when I'm offline, taps away while I code and bops along when music plays.

The look follows the calendar. Spring has sakura petals, summer has fireflies, autumn has falling leaves, winter has snow, and some days get something extra, like Halloween, Christmas, my birthday or April Fools (that one got a bit out of hand).

Everything can be changed from a small admin panel, so I don't have to touch code to write an update, add a project or upload photos. If someone writes me through the contact form, it lands in my Discord DMs.

## Running it

```bash
npm install
cp .env.example .env.local
npm run dev
```

It runs fine without any env vars, you just won't get the admin panel or the weather page. Everything gets stored in `.data/`.

## Where it runs

On a Raspberry Pi at home, behind a Cloudflare Tunnel. It backs itself up every night and sends a copy off the Pi, because SD cards die and I'd rather not find out the hard way.

```bash
npm ci && npm run build
DATA_DIR=/var/lib/vensin UPLOAD_DIR=/var/lib/vensin/uploads npm start
```

Or let [werft](https://github.com/vxnsin/werft) do it, which builds the site, runs it as a service and pulls new commits later with `werft update vensin`:

```bash
sudo werft install https://github.com/vxnsin/vensin-portfolio-v2
```

Caddy, DNS and the tunnel are not part of that; `scripts/setup-pi.sh` still covers them.

Vercel works for previews too, but nothing is saved there between restarts.

## Credits

Pixel icons from [pixelarticons](https://pixelarticons.com) (MIT) and [Pixel Art Icons by YukiPixels](https://github.com/YukiPixels/Pixel-Art-Icons) (CC BY-SA 4.0). Synced lyrics from [LRCLIB](https://lrclib.net).
