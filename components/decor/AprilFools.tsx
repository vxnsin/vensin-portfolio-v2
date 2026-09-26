"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// April 1st: a bundle of harmless pranks. Everything still works, it just misbehaves a little first.

const FLIP: Record<string, string> = {
  a: "ɐ",
  b: "q",
  c: "ɔ",
  d: "p",
  e: "ǝ",
  f: "ɟ",
  g: "ƃ",
  h: "ɥ",
  i: "ᴉ",
  j: "ɾ",
  k: "ʞ",
  l: "l",
  m: "ɯ",
  n: "u",
  o: "o",
  p: "d",
  q: "b",
  r: "ɹ",
  s: "s",
  t: "ʇ",
  u: "n",
  v: "ʌ",
  w: "ʍ",
  x: "x",
  y: "ʎ",
  z: "z",
  ".": "˙",
  ",": "'",
  "!": "¡",
  "?": "¿",
  "—": "—",
  " ": " ",
  "-": "-",
};
const flip = (s: string) =>
  [...s.toLowerCase()]
    .map((c) => FLIP[c] ?? c)
    .reverse()
    .join("");

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-season"],
  });
  return () => obs.disconnect();
}
const isFools = () =>
  document.documentElement.getAttribute("data-season") === "aprilfools";

export function AprilFools() {
  const active = useSyncExternalStore(subscribe, isFools, () => false);
  const [cookies, setCookies] = useState(false);
  const [update, setUpdate] = useState<"hidden" | "downloading" | "jk">(
    "hidden",
  );

  useEffect(() => {
    if (!active) return;

    // 1. the tab title hangs upside down like the wordmark (next.js rewrites <title> on navigation, so keep flipping it)
    let original = document.title;
    const flipTitle = () => {
      const t = document.title;
      if (t === flip(original)) return;
      original = t;
      document.title = flip(t);
    };
    const titleObs = new MutationObserver(flipTitle);
    const titleEl = document.querySelector("title");
    if (titleEl)
      titleObs.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    flipTitle();

    // 2. buttons and tabs dodge the mouse once, then behave
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        ".btn, .tab, button",
      );
      if (!el || el.dataset.dodged || el.closest(".fools-ui")) return;
      el.dataset.dodged = "1";
      const dx = (Math.random() > 0.5 ? 1 : -1) * (24 + Math.random() * 24);
      el.style.transition = "transform 0.15s ease-out";
      el.style.transform = `translate(${dx}px, -6px) rotate(${dx / 8}deg)`;
      setTimeout(() => {
        el.style.transform = "";
      }, 450);
    };
    document.addEventListener("mouseover", onOver);

    // 3. a cookie banner for the chocolate-chip kind, once per session
    let sessionOk = false;
    try {
      sessionOk = !sessionStorage.getItem("fools:cookies");
    } catch {}
    const timers: number[] = [];
    if (sessionOk) timers.push(window.setTimeout(() => setCookies(true), 1500));

    // 4. a "site update" that gets stuck at 99 %
    let stuck = false;
    try {
      stuck = !sessionStorage.getItem("fools:update");
    } catch {}
    if (stuck) {
      timers.push(window.setTimeout(() => setUpdate("downloading"), 12_000));
      timers.push(window.setTimeout(() => setUpdate("jk"), 21_000));
      timers.push(
        window.setTimeout(() => {
          setUpdate("hidden");
          try {
            sessionStorage.setItem("fools:update", "1");
          } catch {}
        }, 27_000),
      );
    }

    console.log(
      "%c nothing to see here. definitely not an april fools joke. ",
      "background:#c7f000;color:#1a1a1a;font-weight:bold;padding:4px 8px",
    );

    return () => {
      titleObs.disconnect();
      document.title = original;
      document.removeEventListener("mouseover", onOver);
      timers.forEach((t) => clearTimeout(t));
    };
  }, [active]);

  if (!active) return null;

  const dismissCookies = () => {
    setCookies(false);
    try {
      sessionStorage.setItem("fools:cookies", "1");
    } catch {}
  };

  return (
    <>
      {cookies && (
        <div
          className="fools-ui fixed bottom-4 right-4 z-50 max-w-[280px] text-xs"
          role="dialog"
          aria-label="cookies"
        >
          <div className="win">
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1">cookies?</span>
            </div>
            <div className="win-body grid gap-2">
              <p>
                this site uses cookies. not the tracking kind, the chocolate
                chip kind. one is on the keyboard right now.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn text-[11px]"
                  onClick={dismissCookies}
                >
                  accept
                </button>
                <button
                  type="button"
                  className="btn text-[11px]"
                  onClick={dismissCookies}
                >
                  also accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {update !== "hidden" && (
        <div
          className="fools-ui fixed bottom-4 left-4 z-50 w-[260px] text-xs"
          role="status"
        >
          <div className="win">
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1">
                {update === "jk" ? "update complete" : "updating vensin.dev"}
              </span>
            </div>
            <div className="win-body grid gap-2">
              {update === "jk" ? (
                <p>just kidding. nothing changed. happy april fools.</p>
              ) : (
                <>
                  <p>downloading v3.0.0 … please do not close this tab.</p>
                  <div className="progress">
                    <i style={{ width: "99%" }} />
                  </div>
                  <div className="text-[10px] text-ink-soft">
                    99% · estimated time remaining: a while
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
