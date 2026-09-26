import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // dev server: hosts other than localhost that may load dev assets (hmr, server actions)
  allowedDevOrigins: ["127.0.0.1", "192.168.178.67", "*.devtunnels.ms", "*.trycloudflare.com"],
  experimental: {
    serverActions: {
      bodySizeLimit: "220mb", // gallery uploads (videos)
      // hosts that may submit server actions (forms). needed when the site is reached through a tunnel, a lan ip or a proxy.
      allowedOrigins: ["vensin.dev", "*.vensin.dev", "*.devtunnels.ms", "*.trycloudflare.com", "localhost:3000", "localhost:3001", "localhost:3002", "127.0.0.1:3000", "127.0.0.1:3001", "127.0.0.1:3002", ...(process.env.SERVER_ACTIONS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
    },
  },
  serverExternalPackages: ["sharp", "heic-convert", "better-sqlite3"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "media.discordapp.net" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "media.kitsu.app" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "opengraph.githubassets.com" },
    ],
  },
};

export default nextConfig;
