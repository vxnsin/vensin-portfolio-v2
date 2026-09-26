"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => {
    obs.disconnect();
    mq.removeEventListener("change", cb);
  };
}

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  // null on the server so the label never mismatches during hydration
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    // one year; the server reads this to render the right theme on the next visit
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <button type="button" onClick={toggle} className="btn text-xs" aria-label="toggle theme">
      {theme === null ? "…" : theme === "dark" ? "☾ night" : "☼ day"}
    </button>
  );
}
