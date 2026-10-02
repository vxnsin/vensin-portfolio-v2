"use client";

import { useEffect } from "react";
import { CAT_FACE_ASLEEP, catFaceIconSvg } from "@/lib/cat-face";

// When the tab goes to the background, mochi falls asleep in the favicon and the title asks you back.
// Everything is put back the moment the tab is active again.
const TITLES = ["zzz… mochi fell asleep", "come back ( ; ω ; )", "the stars are still here"];
const SWAP_MS = 2500;

export function AwayTab() {
  useEffect(() => {
    const icons = () => Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"));
    const asleep = catFaceIconSvg(CAT_FACE_ASLEEP);
    let saved: { title: string; hrefs: Map<HTMLLinkElement, string> } | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;

    const away = () => {
      if (saved) return;
      saved = { title: document.title, hrefs: new Map(icons().map((l) => [l, l.href])) };
      for (const l of saved.hrefs.keys()) l.href = asleep;
      let i = 0;
      document.title = TITLES[0];
      timer = setInterval(() => {
        i = (i + 1) % TITLES.length;
        document.title = TITLES[i];
      }, SWAP_MS);
    };
    const back = () => {
      if (!saved) return;
      clearInterval(timer);
      document.title = saved.title;
      for (const [l, href] of saved.hrefs) l.href = href;
      saved = null;
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? away() : back());

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      back();
    };
  }, []);
  return null;
}
