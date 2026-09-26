import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { CACHE_KEYS, TTL } from "@/lib/jobs";
import { fetchWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

// Served from the sqlite cache (refreshed by the scheduler every 10 min); never exposes coordinates.
export async function GET() {
  if (!process.env.WEATHER_LAT || !process.env.WEATHER_LON) return NextResponse.json({ error: "weather not configured" }, { status: 503 });
  const w = await cached(CACHE_KEYS.weather, TTL.weather, fetchWeather);
  if (!w) return NextResponse.json({ error: "upstream" }, { status: 502 });
  return NextResponse.json(w, { headers: { "cache-control": "public, max-age=120" } });
}
