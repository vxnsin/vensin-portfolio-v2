import type { Metadata, Viewport } from "next";
import { DotGothic16, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { Shell } from "@/components/layout/Shell";
import { Petals } from "@/components/decor/Petals";
import Script from "next/script";
import { themeInitScript } from "@/components/layout/ThemeToggle";

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

// pages re-render at most once a minute from the sqlite cache the scheduler keeps warm
export const revalidate = 60;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4ecf2" },
    { media: "(prefers-color-scheme: dark)", color: "#17121c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dotGothic.variable} ${plexMono.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        {/* applies the saved theme before first paint, without a flash */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Petals />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
