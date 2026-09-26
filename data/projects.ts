export type ProjectLink = {
  type: "website" | "github" | "discord";
  label?: string;
  url: string;
  archived?: boolean;
};

export type ProjectStatus = "active" | "archived" | "shut down";

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  tech: string[];
  thumbnail: string;
  start: number;
  end?: number; // undefined = ongoing
  status: ProjectStatus;
  role: string;
  highlights?: string[];
  links: ProjectLink[];
};

export const projects: Project[] = [
  {
    slug: "vensin-v2",
    name: "vensin.dev v2",
    tagline: "this very site",
    description:
      "A cozy old-web style portfolio rebuilt from scratch: live Discord presence, anime shelf, day/night theme and a layout that also works on a phone.",
    tech: ["TypeScript", "Next.js", "React", "Tailwind", "Vercel"],
    thumbnail: "/projects/thumbnails/portfolio.png",
    start: 2026,
    status: "active",
    role: "design + code",
    highlights: ["lanyard websocket widget", "kitsu-powered anime posters", "zero cookies, zero tracking"],
    links: [{ type: "github", url: "https://github.com/vxnsin/vensin-portfolio-v2" }],
  },
  {
    slug: "warden",
    name: "warden",
    tagline: "nothing binds a port without asking",
    description:
      "A registry that hands out local ports. Services register under a name and get a port back, the same one after every restart, so a backend never wakes up on the port its frontend grabbed. Comes with a TUI, a live event stream, webhooks and a firewall layer.",
    tech: ["Python", "FastAPI", "Textual", "PyPI"],
    thumbnail: "https://opengraph.githubassets.com/1/vxnsin/warden",
    start: 2026,
    status: "active",
    role: "design + code",
    highlights: ["warden run -- npm run dev hands the port over as PORT", "TUI with services, ports, firewall rules and nodes", "exports a Caddyfile from the registry", "one hub, many wardens: works across machines"],
    links: [
      { type: "github", url: "https://github.com/vxnsin/warden" },
      { type: "website", label: "pypi", url: "https://pypi.org/project/warden-ports/" },
    ],
  },
  {
    slug: "okay-garmin",
    name: "Okay-Garmin",
    tagline: "offline voice control for windows",
    description:
      "Say the wake word, then tell the PC what to do: press a hotkey, open a program, skip a track or put on a song. Vosk listens for the wake word, Whisper transcribes the command, nothing leaves the machine. Installer, updater, tray settings, German and English.",
    tech: ["Python", "Vosk", "Whisper", "Spotify API", "pywebview"],
    thumbnail: "https://opengraph.githubassets.com/1/vxnsin/Okay-Garmin",
    start: 2026,
    status: "active",
    role: "design + code",
    highlights: ["fully offline, no cloud, no account", "wake word on a restricted grammar: a few percent of one core while idle", "19 spotify actions plus media keys for any player", "on-screen hud shows what it heard and matched"],
    links: [
      { type: "github", url: "https://github.com/vxnsin/Okay-Garmin" },
      { type: "website", label: "download", url: "https://github.com/vxnsin/Okay-Garmin/releases/latest" },
    ],
  },
  {
    slug: "neopin",
    name: "NeoPin",
    tagline: "self-hosted location sharing",
    description:
      "A React Native app for your phones and a tiny Node.js WebSocket server on your own machine: one map with everyone on it, no third party involved. Nothing is written to disk, restart the server and the slate is clean.",
    tech: ["TypeScript", "React Native", "Expo", "Node.js", "WebSocket", "Leaflet", "Docker"],
    thumbnail: "https://opengraph.githubassets.com/1/vxnsin/NeoPin",
    start: 2025,
    status: "active",
    role: "app + server",
    highlights: ["bring your own server: hostname, password, device name, done", "background location on android and ios", "battery saver / balanced / precise modes", "over-the-air updates via eas"],
    links: [{ type: "github", url: "https://github.com/vxnsin/NeoPin" }],
  },
  {
    slug: "country-flag-utils",
    name: "country-flag-utils",
    tagline: "country lookup for node and the browser",
    description:
      "An npm package with all 250 ISO 3166-1 codes plus Kosovo: alpha-2, alpha-3, numeric, localized names, flag emoji and flag image URLs. Matches codes, names, emoji and 160 aliases regardless of case or accents.",
    tech: ["TypeScript", "Node.js", "npm"],
    thumbnail: "https://opengraph.githubassets.com/1/vxnsin/country-flag-utils",
    start: 2024,
    status: "active",
    role: "author + maintainer",
    highlights: ["32 kB packed, zero runtime dependencies", "esm and commonjs with typings", "a scheduled job verifies every flag url"],
    links: [
      { type: "github", url: "https://github.com/vxnsin/country-flag-utils" },
      { type: "website", label: "npm", url: "https://www.npmjs.com/package/country-flag-utils" },
    ],
  },
  {
    slug: "venix",
    name: "Venix",
    tagline: "anime search bot for slack",
    description:
      "A Slack bot built with Bolt in socket mode: search anime and characters through the Jikan API and get rating, episodes, genres and images as Block Kit messages, plus a random-anime command. Built for the Hack Club Stardance event.",
    tech: ["JavaScript", "Node.js", "Slack Bolt", "Jikan API"],
    thumbnail: "https://opengraph.githubassets.com/1/vxnsin/venix-slack-bot",
    start: 2026,
    end: 2026,
    status: "archived",
    role: "design + code",
    highlights: ["/anime-search, /character-search, /random-anime", "interactive view buttons for character details"],
    links: [{ type: "github", url: "https://github.com/vxnsin/venix-slack-bot" }],
  },
  {
    slug: "velane",
    name: "Velane",
    tagline: "minecraft citybuild server",
    description:
      "A versatile Citybuild server with its own economy, shops and unique items, built for creative players and a friendly community. The server has since been shut down.",
    tech: ["Java", "MySQL", "MongoDB", "Linux", "Maven", "Gradle"],
    thumbnail: "/projects/thumbnails/velane.png",
    start: 2025,
    end: 2025,
    status: "shut down",
    role: "founder + backend",
    highlights: ["custom plugins from scratch", "economy & shop system", "own website, wiki and apply flow"],
    links: [
      { type: "discord", url: "https://discord.gg/velane" },
      { type: "website", url: "https://velane.net" },
    ],
  },
  {
    slug: "portfolio-v1",
    name: "Portfolio v1",
    tagline: "the previous vensin.dev",
    description:
      "My previous portfolio with i18n (en/de), an interactive tech stack section, Steam/TikTok widgets and the first version of the Discord presence widget.",
    tech: ["TypeScript", "Next.js", "React", "Framer Motion", "Tailwind", "Vercel"],
    thumbnail: "/projects/thumbnails/portfolio.png",
    start: 2024,
    end: 2026,
    status: "archived",
    role: "design + code",
    links: [{ type: "github", url: "https://github.com/vxnsin/vensin.dev" }],
  },
  {
    slug: "old-portfolio",
    name: "Old Portfolio",
    tagline: "where it all started",
    description:
      "My very first portfolio site, written in plain HTML, CSS and JavaScript. Not pretty, but it was my start into web development.",
    tech: ["JavaScript", "CSS", "HTML"],
    thumbnail: "/projects/thumbnails/old_portfolio.png",
    start: 2023,
    end: 2024,
    status: "archived",
    role: "learning by doing",
    links: [
      { type: "website", url: "https://vxnsin.github.io/" },
      { type: "github", url: "https://github.com/vxnsin/vxnsin.github.io" },
    ],
  },
  {
    slug: "community-lounge",
    name: "Community Lounge",
    tagline: "discord community + bots",
    description:
      "A community Discord server with custom-built bots for moderation and entertainment. The server got nuked in 2023, which ended the project.",
    tech: ["JavaScript", "MongoDB"],
    thumbnail: "/projects/thumbnails/community_lounge.png",
    start: 2023,
    end: 2023,
    status: "shut down",
    role: "bot developer",
    links: [{ type: "github", label: "bot source", url: "https://github.com/vxnsin/cl-system", archived: true }],
  },
  {
    slug: "gamescloud",
    name: "GamesCloud",
    tagline: "minecraft minigames network",
    description:
      "A Minecraft minigames network with lobby system and multiple game modes. Discontinued due to motivation and internal team issues, but it taught me a lot about Java and server infrastructure.",
    tech: ["Java", "Maven", "MySQL", "Linux"],
    thumbnail: "/projects/thumbnails/gamescloud.png",
    start: 2022,
    end: 2023,
    status: "shut down",
    role: "backend developer",
    links: [{ type: "github", label: "lobby system (mini)", url: "https://github.com/vxnsin/Lobby-mini" }],
  },
];
