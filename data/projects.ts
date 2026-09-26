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
