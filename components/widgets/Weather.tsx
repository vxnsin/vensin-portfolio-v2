"use client";

import { useEffect, useState } from "react";

// Weather comes from our own API route; the location is configured server-side and never exposed.
const REFRESH_MS = 10 * 60 * 1000;

type Current = {
  temperature: number;
  feelsLike: number;
  code: number;
  wind: number;
  isDay: boolean;
  humidity: number;
  time: string | null;
};

/** WMO weather codes → label + glyph */
function describe(code: number, day: boolean): { label: string; icon: string } {
  if (code === 0) return { label: "clear sky", icon: day ? "☀" : "☾" };
  if (code === 1) return { label: "mostly clear", icon: day ? "🌤" : "☾" };
  if (code === 2) return { label: "partly cloudy", icon: "⛅" };
  if (code === 3) return { label: "overcast", icon: "☁" };
  if (code === 45 || code === 48) return { label: "foggy", icon: "🌫" };
  if (code >= 51 && code <= 57) return { label: "drizzle", icon: "🌦" };
  if (code >= 61 && code <= 67) return { label: "rain", icon: "🌧" };
  if (code >= 71 && code <= 77) return { label: "snow", icon: "❄" };
  if (code >= 80 && code <= 82) return { label: "rain showers", icon: "🌧" };
  if (code === 85 || code === 86) return { label: "snow showers", icon: "🌨" };
  if (code >= 95) return { label: "thunderstorm", icon: "⛈" };
  return { label: "weather", icon: "•" };
}

function mood(temp: number, code: number) {
  if (code >= 95) return "perfect thunderstorm-and-anime weather";
  if (code >= 61 && code <= 82) return "rainy. stay in, watch something.";
  if (code >= 71 && code <= 86) return "snow! kotatsu season.";
  if (temp >= 28) return "too hot. send help (and ice).";
  if (temp >= 20) return "nice out. might actually go outside.";
  if (temp >= 10) return "hoodie weather.";
  if (temp >= 0) return "cold. tea and code.";
  return "freezing. do not go outside.";
}

export function Weather() {
  const [data, setData] = useState<Current | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as Current;
        if (alive && typeof json.temperature === "number") setData(json);
      } catch {
        if (alive) setFailed(true);
      }
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (failed) return <p className="text-xs text-ink-soft text-center">weather is hiding today (´・ω・`)</p>;
  if (!data)
    return (
      <p className="text-xs text-ink-soft text-center">
        looking outside<span className="blink">…</span>
      </p>
    );

  const d = describe(data.code, data.isDay);

  return (
    <div className="text-center">
      <div className="text-3xl leading-none" aria-hidden>
        {d.icon}
      </div>
      <div className="pixel text-accent-2 leading-none mt-1" style={{ fontSize: 44 }}>
        {Math.round(data.temperature)}°
      </div>
      <div className="pixel text-sm mt-1">{d.label}</div>
      <div className="text-[11px] text-ink-soft">
        feels {Math.round(data.feelsLike)}° · wind {Math.round(data.wind)} km/h · {data.humidity}%
      </div>
      <div className="text-[11px] text-ink-soft mt-1 italic">{mood(data.temperature, data.code)}</div>
      <div className="text-[10px] text-ink-soft mt-1 opacity-70">outside my window{data.time ? ` · ${data.time}` : ""}</div>
    </div>
  );
}
