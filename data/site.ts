export const site = {
  name: "vensin",
  domain: "vensin.dev",
  url: "https://vensin.dev",
  jpName: "ヴェンシン",
  tagline: "developer · anime enjoyer · music lover",
  description: "vensin's cozy corner of the internet: projects, anime, photos, and what I'm up to right now.",
  discordUserId: "531896089096486922",
  githubUser: "vxnsin",
  codingSince: 2018,
  kaomoji: ["(｡•̀ᴗ-)✧", "( ˶ˆᗜˆ˵ )", "ヽ(>∀<☆)ノ", "(๑˃ᴗ˂)ﻭ", "_(:з)∠)_", "(￣o￣) zzZ"],
  typewriter: [
    "a full-stack developer",
    "an anime enthusiast",
    "a music lover",
    "a passionate rider",
    "probably watching something right now",
  ],
  intro: [
    "Hi, I'm Luis (online: vensin). I'm a developer from Germany who likes building things for the web, running Minecraft servers and watching way too much anime.",
    "This is version 2 of my little corner of the internet. You'll find my projects, what I'm currently into, and a live look at what I'm doing right now via Discord.",
    "Everything here is a work in progress and will keep changing. Enjoy your stay!",
  ],
  // defaults for the "now" box; editable in /admin/site, overridden live by Discord when possible
  now: {
    watching: "see the anime page",
    playing: "Minecraft / War Thunder / Phasmophobia",
    listening: "whatever Spotify says",
    mood: "building this site",
  },
  // seed entries; the live list is managed in /admin/updates
  updateLog: [
    { date: "2026-09-26", text: "new site is live! rebuilt from scratch, old-web vibes, actually works on phones now." },
    { date: "2026-09-26", text: "anime posters now come from kitsu, projects page got filters and highlights." },
  ],
  // seed lines; the live marquee is managed in /admin/site
  marquee: [
    "welcome to vensin.dev",
    "the new site is finally here",
    "(๑˃ᴗ˂)ﻭ",
    "my discord status in the sidebar is live, say hi",
    "hand-built with next.js, no template",
    "if something looks weird, hard refresh and blame me",
    "go watch more anime",
    "ヽ(>∀<☆)ノ",
    "minecraft servers are my love language",
  ],
};

export const socials = [
  { id: "github", label: "GitHub", url: "https://github.com/vxnsin", handle: "@vxnsin" },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@vxnsin", handle: "@vxnsin" },
  { id: "steam", label: "Steam", url: "https://steamcommunity.com/id/Vxnsin", handle: "Vxnsin" },
  { id: "discord", label: "Discord", url: "https://discord.gg/velane", handle: "velane server" },
];

export const nav = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/anime", label: "anime" },
  { href: "/gallery", label: "gallery" },
  { href: "/links", label: "links" },
] as const;
