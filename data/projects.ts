export type ProjectLink = {
  type: "website" | "github" | "discord";
  label?: string;
  url: string;
  archived?: boolean;
};

export type Project = {
  slug: string;
  name: string;
  description: string;
  tech: string[];
  thumbnail: string;
  years: string;
  status: "active" | "archived" | "shut down";
  links: ProjectLink[];
};

export const projects: Project[] = [
  {
    slug: "vensin-v2",
    name: "vensin.dev v2",
    description:
      "This site. A cozy old-web style portfolio rebuilt from scratch with Next.js, live Discord presence and lots of anime energy.",
    tech: ["TypeScript", "Next.js", "React", "Tailwind", "Vercel"],
    thumbnail: "/projects/thumbnails/portfolio.png",
    years: "2026",
    status: "active",
    links: [{ type: "github", url: "https://github.com/vxnsin/vensin-portfolio-v2" }],
  },
  {
    slug: "velane",
    name: "Velane",
    description:
      "A versatile Minecraft Citybuild server with its own economy, shops and unique items. Built for creative players and a friendly community. The server has since been shut down.",
    tech: ["Java", "MySQL", "MongoDB", "Linux", "Maven", "Gradle"],
    thumbnail: "/projects/thumbnails/velane.png",
    years: "2025",
    status: "shut down",
    links: [
      { type: "discord", url: "https://discord.gg/velane" },
      { type: "website", url: "https://velane.net" },
    ],
  },
  {
    slug: "portfolio-v1",
    name: "Portfolio v1",
    description:
      "My previous portfolio website with i18n, a tech stack section and Discord presence. The base this version grew out of.",
    tech: ["TypeScript", "Next.js", "React", "Framer Motion", "Tailwind", "Vercel"],
    thumbnail: "/projects/thumbnails/portfolio.png",
    years: "2024 – 2026",
    status: "archived",
    links: [{ type: "github", url: "https://github.com/vxnsin/vensin.dev" }],
  },
  {
    slug: "old-portfolio",
    name: "Old Portfolio",
    description:
      "My very first portfolio site where I learned HTML, CSS and JavaScript. It was my start into web development.",
    tech: ["JavaScript", "CSS", "HTML"],
    thumbnail: "/projects/thumbnails/old_portfolio.png",
    years: "2023 – 2024",
    status: "archived",
    links: [
      { type: "website", url: "https://vxnsin.github.io/" },
      { type: "github", url: "https://github.com/vxnsin/vxnsin.github.io" },
    ],
  },
  {
    slug: "community-lounge",
    name: "Community Lounge",
    description:
      "A community Discord server with custom-built bots for moderation and entertainment. The server got nuked in 2023, which ended the project.",
    tech: ["JavaScript", "MongoDB"],
    thumbnail: "/projects/thumbnails/community_lounge.png",
    years: "2023",
    status: "shut down",
    links: [{ type: "github", label: "Discord Bot", url: "https://github.com/vxnsin/cl-system", archived: true }],
  },
  {
    slug: "gamescloud",
    name: "GamesCloud",
    description: "A Minecraft minigames network that was discontinued due to motivation and internal team issues.",
    tech: ["Java", "Maven", "MySQL", "Linux"],
    thumbnail: "/projects/thumbnails/gamescloud.png",
    years: "2022 – 2023",
    status: "shut down",
    links: [{ type: "github", label: "Lobby-System (mini)", url: "https://github.com/vxnsin/Lobby-mini" }],
  },
];
