export const site = {
  name: "vensin",
  domain: "vensin.dev",
  url: "https://vensin.dev",
  jpName: "ヴェンシン",
  tagline: "developer · anime enjoyer · motorcycle rider",
  description: "vensin's cozy corner of the internet: projects, anime, photos from the bike, and what I'm up to right now.",
  discordUserId: "531896089096486922",
  githubUser: "vxnsin",
  codingSince: 2018,
  kaomoji: ["(｡•̀ᴗ-)✧", "( ˶ˆᗜˆ˵ )", "ヽ(>∀<☆)ノ", "(๑˃ᴗ˂)ﻭ", "_(:з)∠)_", "(￣o￣) zzZ"],
  typewriter: [
    "a full-stack developer",
    "an anime enthusiast",
    "a motorcycle rider",
    "a music lover",
    "probably watching something right now",
  ],
  intro: [
    "Hi, I'm Luis (online: vensin). I'm a developer from Germany who likes building things for the web, running Minecraft servers and watching way too much anime.",
    "When I'm not at the keyboard I'm probably on my motorcycle. Some of the photos from those rides end up in the gallery.",
    "This is version 2 of my little corner of the internet. You'll find my projects, what I'm currently into, and a live look at what I'm doing right now via Discord. Everything here is a work in progress. Enjoy your stay!",
  ],
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
    "new bike photos in the gallery",
  ],
};

export const socials = [
  { id: "github", label: "GitHub", url: "https://github.com/vxnsin", handle: "@vxnsin" },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@vxnsin", handle: "@vxnsin" },
  { id: "instagram", label: "Instagram", url: "https://www.instagram.com/vxn_sin/", handle: "@vxn_sin" },
  { id: "snapchat", label: "Snapchat", url: "https://www.snapchat.com/add/vxn_sin", handle: "@vxn_sin" },
  { id: "steam", label: "Steam", url: "https://steamcommunity.com/id/Vxnsin", handle: "Vxnsin" },
  { id: "discord", label: "Discord", url: "https://discord.gg/velane", handle: "velane server" },
];

export const nav = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/anime", label: "anime" },
  { href: "/music", label: "music" },
  { href: "/gallery", label: "gallery" },
  { href: "/links", label: "links" },
  { href: "/guestbook", label: "guestbook" },
] as const;
