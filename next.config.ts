import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "220mb" }, // gallery uploads (videos)
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
