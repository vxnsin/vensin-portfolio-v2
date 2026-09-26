export const site = {
  name: "vensin",
  domain: "vensin.dev",
  url: "https://vensin.dev",
  jpName: "ヴェンシン",
  tagline: "developer · anime enjoyer · music lover",
  discordUserId: "531896089096486922",
  githubUser: "vxnsin",
  codingSince: 2018,
  version: { tag: "v2", codename: "sakura", since: 2026 },
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
  now: {
    watching: "see the anime page",
    playing: "Minecraft / War Thunder / Phasmophobia",
    listening: "whatever Spotify says",
    mood: "building this site",
  },
  updateLog: [
    { date: "2026-09-26", text: "v2 'sakura' is live! rebuilt from scratch with a cozy old-web layout." },
    { date: "2026-09-26", text: "discord presence, projects, anime and links pages added." },
  ],
  marquee: [
    "welcome to vensin.dev",
    "version 2 'sakura' is out",
    "(๑˃ᴗ˂)ﻭ",
    "check my discord status in the sidebar",
    "built with next.js + love",
    "ctrl + shift + r if something looks weird",
    "watch more anime",
    "ヽ(>∀<☆)ノ",
  ],
};

export const socials = [
  { id: "github", label: "GitHub", url: "https://github.com/vxnsin", handle: "@vxnsin" },
  { id: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@vxnsin", handle: "@vxnsin" },
  { id: "youtube", label: "YouTube", url: "https://www.youtube.com/@vxnsin", handle: "@vxnsin" },
  { id: "steam", label: "Steam", url: "https://steamcommunity.com/id/Vxnsin", handle: "Vxnsin" },
  { id: "discord", label: "Discord", url: "https://discord.gg/velane", handle: "velane server" },
];

export const nav = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/projects", label: "projects" },
  { href: "/anime", label: "anime" },
  { href: "/links", label: "links" },
] as const;
