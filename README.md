<div align="center">

# vensin.dev

**my little corner of the internet, take two**

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Raspberry Pi](https://img.shields.io/badge/Raspberry%20Pi-A22846?style=for-the-badge&logo=raspberrypi&logoColor=white)

</div>

---

## What is this?

This is the second version of my personal site. The first one was fine, but it felt like every other portfolio: a hero, three cards, a footer. I wanted something with more personality, so I threw it away and started over with the old web in mind. Small windows, pixel fonts, a marquee, 88x31 buttons from friends' sites, a guestbook, a visitor counter. A cozy little place, with a bit of anime energy on top.

The site is also a bit alive. The sidebar shows what I'm doing on Discord right now, whether that's coding, listening to something or watching an episode. There's a music page that follows my Spotify, an anime page with what I watched lately, and a gallery for photos and videos. A pixel cat called Mochi sits in the sidebar and reacts to all of it: she sleeps when I'm offline, taps away while I code and bops along when music plays.

The look follows the calendar. Spring has sakura petals, summer has fireflies, autumn has falling leaves, winter has snow. Some days get something extra, like Halloween, Christmas, my birthday or April Fools (that one got a bit out of hand).

Everything on the site can be changed from a small admin panel, so I don't have to touch code to write an update, add a project or upload photos. If someone writes me through the contact form, it lands in my Discord DMs with a button to mark it as read.

## Tech

<p>
  <img src="public/icons/nextjs.svg" height="36" alt="Next.js" />&nbsp;
  <img src="public/icons/typescript.svg" height="36" alt="TypeScript" />&nbsp;
  <img src="public/icons/react.svg" height="36" alt="React" />&nbsp;
  <img src="public/icons/tailwind.svg" height="36" alt="Tailwind" />&nbsp;
  <img src="public/icons/nodejs.svg" height="36" alt="Node.js" />&nbsp;
  <img src="public/icons/raspberrypi.svg" height="36" alt="Raspberry Pi" />&nbsp;
  <img src="public/icons/github.svg" height="36" alt="GitHub" />&nbsp;
  <img src="public/icons/vercel.svg" height="36" alt="Vercel" />
</p>

It's a Next.js app with TypeScript and Tailwind. Everything lives in a single SQLite file, including a cache of the stuff I pull in from outside (Lanyard for Discord, Spotify, Kitsu for anime posters, GitHub, a weather API). A small scheduler inside the app refreshes that cache in the background, so nobody visiting the site ever waits on someone else's API.

## Running it

```bash
npm install
cp .env.example .env.local
npm run dev
```

It runs fine without any env vars. You just won't get the admin panel or the weather page. Everything gets stored in `.data/`.

## Where it runs

On a Raspberry Pi at home, behind a Cloudflare Tunnel. It backs itself up every night and sends a copy off the Pi, because SD cards die and I'd rather not find out the hard way.

```bash
npm ci && npm run build
DATA_DIR=/var/lib/vensin UPLOAD_DIR=/var/lib/vensin/uploads npm start
```

Vercel works for previews too, but nothing is saved there between restarts.

## Credits

Pixel icons from [pixelarticons](https://pixelarticons.com) (MIT) and [Pixel Art Icons by YukiPixels](https://github.com/YukiPixels/Pixel-Art-Icons) (CC BY-SA 4.0). Synced lyrics from [LRCLIB](https://lrclib.net).

<div align="center">

made with too much coffee in Germany

</div>
