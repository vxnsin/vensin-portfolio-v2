export type Tech = {
  name: string;
  icon: string;
  since: number;
  level: "Expert" | "Master" | "Advanced";
  note: string;
};

export const techstack: Tech[] = [
  { name: "Java", icon: "/icons/java.svg", since: 2018, level: "Expert", note: "Started because of Minecraft and learned programming early on." },
  { name: "JavaScript", icon: "/icons/javascript.svg", since: 2020, level: "Master", note: "Self-taught for dynamic websites and modern web development." },
  { name: "TypeScript", icon: "/icons/typescript.svg", since: 2021, level: "Advanced", note: "Makes JavaScript scalable and type-safe, especially in React/Next.js projects." },
  { name: "HTML", icon: "/icons/html.svg", since: 2020, level: "Expert", note: "The basis of every website." },
  { name: "CSS", icon: "/icons/css.svg", since: 2020, level: "Expert", note: "Designing interfaces individually and modern, self-taught from the ground up." },
  { name: "React", icon: "/icons/react.svg", since: 2021, level: "Expert", note: "Used intensively for complex UIs and state management." },
  { name: "Next.js", icon: "/icons/nextjs.svg", since: 2022, level: "Expert", note: "Fullstack and SSR/SSG projects. This site runs on it." },
  { name: "Tailwind", icon: "/icons/tailwind.svg", since: 2022, level: "Advanced", note: "Utility-first CSS to style quickly and consistently." },
  { name: "Node.js", icon: "/icons/nodejs.svg", since: 2020, level: "Expert", note: "Backend and tooling, APIs and automation." },
  { name: "Maven", icon: "/icons/maven.svg", since: 2018, level: "Advanced", note: "Java build tool for larger Java projects." },
  { name: "Gradle", icon: "/icons/gradle.svg", since: 2024, level: "Advanced", note: "Flexible build tool for modern Java/Kotlin projects." },
  { name: "MongoDB", icon: "/icons/mongodb.svg", since: 2020, level: "Advanced", note: "Flexible, document-based data storage." },
  { name: "MySQL", icon: "/icons/mysql.svg", since: 2018, level: "Advanced", note: "Got to know it through Minecraft servers." },
  { name: "Git", icon: "/icons/git.svg", since: 2020, level: "Expert", note: "Version control in every project, my daily tool." },
  { name: "Linux", icon: "/icons/linux.svg", since: 2019, level: "Advanced", note: "Servers, development and my main OS in everyday life." },
  { name: "Vercel", icon: "/icons/vercel.svg", since: 2022, level: "Advanced", note: "Simple and fast deployments of Next.js projects." },
];
