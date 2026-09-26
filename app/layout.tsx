import type { Metadata, Viewport } from "next";
import { DotGothic16, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { Shell } from "@/components/layout/Shell";
import { Petals } from "@/components/decor/Petals";
import { cookies } from "next/headers";

const dotGothic = DotGothic16({ weight: "400", subsets: ["latin"], variable: "--font-dot-gothic", display: "swap" });
const plexMono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.domain} — home`, template: `${site.domain} — %s` },
  description: "vensin's cozy corner of the internet: projects, anime, and what I'm up to right now.",
  keywords: ["vensin", "vxnsin", "vensin.dev", "portfolio", "developer", "anime"],
  openGraph: {
    title: site.domain,
    description: "vensin's cozy corner of the internet: projects, anime, and what I'm up to right now.",
    url: site.url,
    siteName: site.domain,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ecf2" },
    { media: "(prefers-color-scheme: dark)", color: "#17121c" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // the chosen theme lives in a cookie so the server can render it straight into <html>; without one, css follows the system setting
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "light" || saved === "dark" ? saved : undefined;
  return (
    <html lang="en" className={`${dotGothic.variable} ${plexMono.variable} h-full`} data-theme={theme}>
      <body className="min-h-full">
        <Petals />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
