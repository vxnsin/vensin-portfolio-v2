"use client";

import { useSyncExternalStore } from "react";
import { WeatherIcon } from "@/components/icons/WeatherIcon";

const TICK_MS = 30_000;
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, TICK_MS);
  return () => clearInterval(id);
};
const getTick = () => Math.floor(Date.now() / TICK_MS);

function animeSeason(month: number, year: number) {
  if (month <= 3) return { name: "winter", jp: "冬", year };
  if (month <= 6) return { name: "spring", jp: "春", year };
  if (month <= 9) return { name: "summer", jp: "夏", year };
  return { name: "fall", jp: "秋", year };
}

function timeOfDay(hour: number) {
  if (hour >= 5 && hour < 11) return { label: "morning", jp: "おはよう", icon: "sun" };
  if (hour >= 11 && hour < 17) return { label: "afternoon", jp: "こんにちは", icon: "sun-solid" };
  if (hour >= 17 && hour < 22) return { label: "evening", jp: "こんばんは", icon: "cloud-moon" };
  return { label: "late night", jp: "おやすみ", icon: "moon" };
}

/** Tokyo clock + current anime season. Shown until Apple Watch data arrives. */
export function JapanNow() {
  const tick = useSyncExternalStore(subscribe, getTick, () => null);
  if (tick === null) return <div />;

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = parseInt(get("hour"), 10);
  const tod = timeOfDay(hour);
  const season = animeSeason(now.getMonth() + 1, now.getFullYear());
  const ahead = 9 - -now.getTimezoneOffset() / 60;

  return (
    <div className="text-center leading-tight">
      <div className="flex items-center justify-center gap-3">
        <WeatherIcon name={tod.icon} size={36} className="text-accent" />
        <span className="pixel text-accent-2 leading-none" style={{ fontSize: 48 }}>
          {get("hour")}:{get("minute")}
        </span>
      </div>
      <div className="pixel text-sm mt-1">
        {tod.jp} · {tod.label} in tokyo
      </div>
      <div className="text-[11px] text-ink-soft">
        {get("weekday").toLowerCase()} · {ahead > 0 ? `${ahead}h ahead of you` : "same time as you"}
      </div>
      <div className="text-[11px] text-ink-soft mt-1">
        anime season: <span className="text-accent">{season.jp} {season.name} {season.year}</span>
      </div>
    </div>
  );
}
