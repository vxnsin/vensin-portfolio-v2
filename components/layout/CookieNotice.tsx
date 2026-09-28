"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getConsent, setConsent, subscribeConsent, subscribeOpen, type Consent } from "@/lib/consent";

// The small window at the bottom that asks whether the site may remember the look and the cat.
// Shows until answered, and again when the "cookies" button in the footer is pressed.

// "open" lives outside react: the footer button and setConsent flip it, the component only subscribes
let forced = false;
function subscribe(cb: () => void) {
  const unOpen = subscribeOpen(() => {
    forced = true;
    cb();
  });
  const unChange = subscribeConsent(() => {
    forced = false;
    cb();
  });
  return () => {
    unOpen();
    unChange();
  };
}
type Snap = { open: boolean; current: Consent | null };
let last: Snap = { open: false, current: null };
function getSnapshot(): Snap {
  const current = getConsent();
  const open = forced || current === null;
  if (open !== last.open || current !== last.current) last = { open, current };
  return last;
}
const serverSnapshot: Snap = { open: false, current: null };

export function CookieNotice() {
  const { open, current } = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  if (!open) return null;

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[95] w-[calc(100vw-1.5rem)] max-w-xl" role="dialog" aria-label="cookies">
      <div className="win win-dashed">
        <div className="win-title">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="pixel">cookies?</span>
        </div>
        <div className="win-body grid gap-2 text-xs">
          <p>
            this site sets a cookie for your <b>theme</b> and <b>season</b> pick, and keeps <b>mochi</b>&apos;s shape and clicker save in your browser.
            that&apos;s all. no tracking, no ads, nothing leaves your browser. <Link href="/privacy">details</Link>
          </p>
          {current && <p className="text-ink-soft">current choice: {current === "all" ? "remember the look and the cat" : "only what's needed"}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setConsent("all")} className="btn text-xs">
              okay, remember it
            </button>
            <button type="button" onClick={() => setConsent("necessary")} className="btn text-xs">
              only what&apos;s needed
            </button>
          </div>
          <p className="text-[10px] text-ink-soft">with &quot;only what&apos;s needed&quot; the switches still work, the site just forgets them when you leave.</p>
        </div>
      </div>
    </div>
  );
}
