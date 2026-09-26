"use client";

import { useSyncExternalStore } from "react";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const TICK_MS = 30_000;

function subscribe(cb: () => void) {
  const id = setInterval(cb, TICK_MS);
  return () => clearInterval(id);
}
const getTick = () => Math.floor(Date.now() / TICK_MS);

export function DateBlock() {
  // null on the server: the visitor's local date is only known in the browser
  const tick = useSyncExternalStore(subscribe, getTick, () => null);
  if (tick === null) return <div />;

  const now = new Date();
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const fools = document.documentElement.getAttribute("data-season") === "aprilfools";
  if (fools) {
    return (
      <div className="text-center leading-tight">
        <div className="pixel text-accent-2 leading-none" style={{ fontSize: 72 }}>
          32
        </div>
        <div className="pixel text-sm mt-1">someday</div>
        <div className="text-xs text-ink-soft">march {now.getFullYear()}</div>
        <div className="text-xs text-ink-soft mt-1">{time} (probably)</div>
      </div>
    );
  }

  return (
    <div className="text-center leading-tight">
      <div className="pixel text-accent-2 leading-none" style={{ fontSize: 72 }}>
        {now.getDate()}
      </div>
      <div className="pixel text-sm mt-1">{DAYS[now.getDay()]}</div>
      <div className="text-xs text-ink-soft">
        {MONTHS[now.getMonth()]} {now.getFullYear()}
      </div>
      <div className="text-xs text-ink-soft mt-1">{time}</div>
    </div>
  );
}
