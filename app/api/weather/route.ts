import { NextResponse } from "next/server";

// Coordinates live only in env vars (server side), never in the client bundle or in any response.
const LAT = process.env.WEATHER_LAT;
const LON = process.env.WEATHER_LON;

export const revalidate = 600;

export async function GET() {
  if (!LAT || !LON) return NextResponse.json({ error: "weather not configured" }, { status: 503 });

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day,relative_humidity_2m&timezone=Europe%2FBerlin`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const json = await res.json();
    const c = json?.current ?? {};
    // whitelist only the fields the widget needs; no coordinates, no place names
    return NextResponse.json(
      {
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        code: c.weather_code,
        wind: c.wind_speed_10m,
        isDay: c.is_day === 1,
        humidity: c.relative_humidity_2m,
        time: typeof c.time === "string" ? c.time.slice(11, 16) : null,
      },
      { headers: { "cache-control": "public, max-age=300, s-maxage=600" } },
    );
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
