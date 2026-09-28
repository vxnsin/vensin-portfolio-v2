"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Window } from "@/components/layout/Window";
import { FRAME_MS, Sprite, framesFor, type Frame } from "@/components/widgets/cat-frames";
import { readForm, subscribeForm } from "@/components/widgets/mochi-form";
import { canStore } from "@/lib/consent";
import { isSeason, type Season } from "@/lib/season-data";
import {
  ACHIEVEMENTS, BUILDINGS, GOLDEN_LIFETIME_MS, GOLDEN_MAX_MS, GOLDEN_MIN_MS, OFFLINE_CAP_MS, UPGRADES, WHISKER_BONUS,
  buildingCost, buildingCps, clickValue, emptySave, fmt, fmtDuration, goldenEffect, lifetimeForWhiskers, parseSave, totalCps, upgradeAvailable, whiskersFor,
  type Building, type Save, type Upgrade,
} from "@/lib/mochi-game";
import { PixelIcon8 } from "./icons";

// The mochi clicker. Everything lives in the browser (local storage); the only thing that leaves is the number of clicks,
// sent in small batches so the "clicked by everyone" counter on the page can move.

const STORAGE = "mochi:clicker";
const TICK_MS = 100;
const SAVE_MS = 5_000;
const SYNC_MS = 15_000;

type Buffs = { frenzyUntil: number; frenzyMult: number; clickUntil: number; clickMult: number };
type Golden = { id: number; x: number; y: number; until: number };
type Pop = { id: number; x: number; y: number; text: string };
type Toast = { id: number; text: string };

function subscribeSeason(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-season"] });
  return () => obs.disconnect();
}
const readSeason = (): Season | null => {
  const v = document.documentElement.getAttribute("data-season");
  return isSeason(v) ? v : null;
};

function loadSave(): { save: Save; away: number } {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const s = parseSave(JSON.parse(raw));
      if (s) {
        const elapsed = Math.min(OFFLINE_CAP_MS, Math.max(0, Date.now() - s.savedAt));
        const away = (totalCps(s) * elapsed) / 1000;
        return { save: { ...s, mochi: s.mochi + away, earned: s.earned + away }, away: elapsed > 60_000 ? away : 0 };
      }
    }
  } catch {}
  return { save: emptySave(), away: 0 };
}

export function Clicker({ initialGlobal, season: initialSeason }: { initialGlobal: number; season: Season }) {
  const season = useSyncExternalStore(subscribeSeason, readSeason, () => initialSeason);
  const form = useSyncExternalStore(subscribeForm, readForm, () => "cat" as const);
  const catgirl = form === "catgirl";

  const [save, setSave] = useState<Save>(emptySave);
  const [loaded, setLoaded] = useState(false);
  const [buffs, setBuffs] = useState<Buffs>({ frenzyUntil: 0, frenzyMult: 1, clickUntil: 0, clickMult: 1 });
  const [now, setNow] = useState(0);
  const [golden, setGolden] = useState<Golden | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [global, setGlobal] = useState(initialGlobal);
  const [frame, setFrame] = useState(0);
  const [poked, setPoked] = useState(false);
  const [confirmLife, setConfirmLife] = useState(false);
  const [tab, setTab] = useState<"shop" | "upgrades" | "badges">("shop");

  const saveRef = useRef(save);
  const buffsRef = useRef(buffs);
  const pending = useRef(0);
  const ids = useRef(1);
  const arena = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    buffsRef.current = buffs;
  }, [buffs]);

  const toast = useCallback((text: string) => {
    const id = ids.current++;
    setToasts((t) => [...t.slice(-3), { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  // load the save once the page is in the browser
  useEffect(() => {
    const t = setTimeout(() => {
      const { save: s, away } = loadSave();
      setSave(s);
      setLoaded(true);
      setNow(Date.now());
      if (away >= 1) toast(`while you were away mochi made ${fmt(away)} mochi`);
    }, 0);
    return () => clearTimeout(t);
  }, [toast]);

  // production tick
  useEffect(() => {
    if (!loaded) return;
    let last = Date.now();
    const id = setInterval(() => {
      const t = Date.now();
      const dt = (t - last) / 1000;
      last = t;
      setNow(t);
      const b = buffsRef.current;
      if ((b.frenzyUntil && b.frenzyUntil < t) || (b.clickUntil && b.clickUntil < t)) {
        setBuffs({ frenzyUntil: b.frenzyUntil < t ? 0 : b.frenzyUntil, frenzyMult: b.frenzyUntil < t ? 1 : b.frenzyMult, clickUntil: b.clickUntil < t ? 0 : b.clickUntil, clickMult: b.clickUntil < t ? 1 : b.clickMult });
      }
      const s = saveRef.current;
      const gain = totalCps(s) * (b.frenzyUntil > t ? b.frenzyMult : 1) * dt;
      const fresh = ACHIEVEMENTS.filter((a) => !s.achievements.includes(a.id) && a.test(s, totalCps(s))).map((a) => a.id);
      if (gain > 0 || fresh.length) {
        setSave((cur) => ({ ...cur, mochi: cur.mochi + gain, earned: cur.earned + gain, achievements: fresh.length ? [...cur.achievements, ...fresh.filter((id) => !cur.achievements.includes(id))] : cur.achievements }));
        for (const id of fresh) toast(`achievement: ${ACHIEVEMENTS.find((a) => a.id === id)?.name}`);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [loaded, toast]);

  // save every few seconds and when the tab goes away
  useEffect(() => {
    if (!loaded) return;
    const write = () => {
      if (!canStore()) return; // the visitor said no to remembering (cookie notice): the game runs, the save stays in memory
      try {
        localStorage.setItem(STORAGE, JSON.stringify({ ...saveRef.current, savedAt: Date.now() }));
      } catch {}
    };
    const id = setInterval(write, SAVE_MS);
    const onHide = () => document.visibilityState === "hidden" && write();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", write);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", write);
      write();
    };
  }, [loaded]);

  // the shared click counter: send what piled up, or just ask for the current number
  useEffect(() => {
    const id = setInterval(async () => {
      const n = pending.current;
      pending.current = 0;
      try {
        const res = n > 0 ? await fetch("/api/mochi", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clicks: n }) }) : await fetch("/api/mochi", { cache: "no-store" });
        if (res.ok) setGlobal((await res.json()).clicks);
        else pending.current += n;
      } catch {
        pending.current += n;
      }
    }, SYNC_MS);
    return () => clearInterval(id);
  }, []);

  // golden mochi drifts in now and then
  useEffect(() => {
    if (!loaded) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const id = ids.current++;
        setGolden({ id, x: 10 + Math.random() * 70, y: 10 + Math.random() * 60, until: Date.now() + GOLDEN_LIFETIME_MS });
        setTimeout(() => setGolden((g) => (g?.id === id ? null : g)), GOLDEN_LIFETIME_MS);
        schedule();
      }, GOLDEN_MIN_MS + Math.random() * (GOLDEN_MAX_MS - GOLDEN_MIN_MS));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [loaded]);

  // sprite animation
  const mood = poked ? "poke" : "idle";
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => f + 1), FRAME_MS[mood]);
    return () => clearInterval(id);
  }, [mood]);

  const cpsBase = totalCps(save);
  const frenzy = buffs.frenzyUntil > now ? buffs.frenzyMult : 1;
  const clickFrenzy = buffs.clickUntil > now ? buffs.clickMult : 1;
  const cps = cpsBase * frenzy;
  const perClick = clickValue(save, cpsBase, catgirl) * clickFrenzy;

  const onClickCat = (e: React.MouseEvent<HTMLButtonElement>) => {
    const gain = perClick;
    pending.current++;
    setSave((s) => ({ ...s, mochi: s.mochi + gain, earned: s.earned + gain, clicks: s.clicks + 1, nya: s.nya || catgirl }));
    setPoked(true);
    setTimeout(() => setPoked(false), 700);
    const box = arena.current?.getBoundingClientRect();
    if (box) {
      const id = ids.current++;
      setPops((p) => [...p.slice(-14), { id, x: e.clientX - box.left, y: e.clientY - box.top, text: `+${fmt(gain, true)}` }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 900);
    }
  };

  const catchGolden = () => {
    if (!golden) return;
    setGolden(null);
    const effect = goldenEffect(Math.random(), cpsBase, save.mochi);
    const t = Date.now();
    if (effect.kind === "frenzy") {
      setBuffs((b) => ({ ...b, frenzyUntil: t + effect.seconds * 1000, frenzyMult: effect.mult }));
      toast(`frenzy! production x${effect.mult} for ${effect.seconds}s`);
    } else if (effect.kind === "clickfrenzy") {
      setBuffs((b) => ({ ...b, clickUntil: t + effect.seconds * 1000, clickMult: effect.mult }));
      toast(`click frenzy! clicks x${effect.mult} for ${effect.seconds}s`);
    } else {
      toast(`lucky! +${fmt(effect.amount)} mochi`);
    }
    setSave((s) => ({ ...s, goldens: s.goldens + 1, ...(effect.kind === "lump" ? { mochi: s.mochi + effect.amount, earned: s.earned + effect.amount } : {}) }));
  };

  const buy = (b: Building) => {
    setSave((s) => {
      const cost = buildingCost(b, s.owned[b.id] ?? 0);
      if (s.mochi < cost) return s;
      return { ...s, mochi: s.mochi - cost, owned: { ...s.owned, [b.id]: (s.owned[b.id] ?? 0) + 1 } };
    });
  };
  const buyUpgrade = (u: Upgrade) => {
    setSave((s) => (s.mochi < u.cost || !upgradeAvailable(s, u) ? s : { ...s, mochi: s.mochi - u.cost, upgrades: [...s.upgrades, u.id] }));
  };

  const lifetimeAll = save.lifetime + save.earned;
  const whiskersNow = whiskersFor(lifetimeAll);
  const whiskerGain = Math.max(0, whiskersNow - save.whiskers);
  const nextWhiskerAt = lifetimeForWhiskers(whiskersNow + 1);
  const rebirth = () => {
    if (!confirmLife) {
      setConfirmLife(true);
      setTimeout(() => setConfirmLife(false), 6000);
      return;
    }
    setConfirmLife(false);
    setSave((s) => ({ ...emptySave(), lifetime: s.lifetime + s.earned, whiskers: whiskersFor(s.lifetime + s.earned), lives: s.lives + 1, achievements: s.achievements, goldens: s.goldens, clicks: s.clicks, nya: s.nya }));
    setBuffs({ frenzyUntil: 0, frenzyMult: 1, clickUntil: 0, clickMult: 1 });
    toast("a new life. the whiskers stay.");
  };

  const frames = framesFor(form).idle;
  const pokeFrames = framesFor(form).poke;
  const current: Frame = poked ? pokeFrames[frame % pokeFrames.length] : frames[frame % frames.length];
  const visibleUpgrades = UPGRADES.filter((u) => upgradeAvailable(save, u)).sort((a, b) => a.cost - b.cost).slice(0, 12);

  return (
    <div className="grid gap-4">
      {/* numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Stat label="mochi" value={loaded ? fmt(save.mochi) : "…"} big />
        <Stat label="per second" value={loaded ? fmt(cps, true) : "…"} note={frenzy > 1 ? `frenzy x${frenzy} · ${fmtDuration((buffs.frenzyUntil - now) / 1000)}` : undefined} />
        <Stat label="per click" value={loaded ? fmt(perClick, true) : "…"} note={clickFrenzy > 1 ? `x${clickFrenzy} · ${fmtDuration((buffs.clickUntil - now) / 1000)}` : catgirl ? "nya bonus +10%" : undefined} />
        <Stat label="clicked by everyone" value={fmt(global)} note="all visitors, all time" />
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px] items-start">
        <div className="grid gap-4 min-w-0">
          {/* the cat */}
          <Window title={catgirl ? "mochi (catgirl)" : "mochi"} right={<span className="text-[10px] text-ink-soft">click her</span>}>
            <div ref={arena} className="relative h-[260px] sm:h-[300px] grid place-items-center select-none overflow-hidden">
              <button type="button" onClick={onClickCat} className={`clicker-cat relative cursor-pointer border border-dashed border-line bg-paper-2 p-3 hover:border-accent transition-colors ${poked ? "bump" : ""}`} aria-label="click mochi">
                <Sprite frame={current} season={season} scale={catgirl ? 9 : 11} />
              </button>
              {pops.map((p) => (
                <span key={p.id} className="pop pixel text-accent text-sm" style={{ left: p.x, top: p.y }}>
                  {p.text}
                </span>
              ))}
              {golden && (
                <button type="button" onClick={catchGolden} className="golden absolute cursor-pointer" style={{ left: `${golden.x}%`, top: `${golden.y}%` }} aria-label="golden mochi" title="golden mochi!">
                  <PixelIcon8 name="golden" scale={5} />
                </button>
              )}
              <div className="absolute left-2 bottom-2 grid gap-1 pointer-events-none">
                {toasts.map((t) => (
                  <div key={t.id} className="toast text-[10px] border border-line bg-paper px-2 py-1">
                    {t.text}
                  </div>
                ))}
              </div>
            </div>
          </Window>

          {/* nine lives */}
          <Window title="nine lives" dashed right={<span className="text-[10px] text-ink-soft">prestige</span>}>
            <div className="grid gap-2 text-xs sm:grid-cols-[1fr_auto] items-center">
              <div className="grid gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <PixelIcon8 name="whisker" scale={2} />
                  <span>
                    <span className="pixel text-ink">{save.whiskers} whiskers</span> <span className="text-ink-soft">· +{Math.round(save.whiskers * WHISKER_BONUS * 100)}% to everything · life {save.lives + 1}</span>
                  </span>
                </div>
                <div className="text-ink-soft">
                  a new life resets mochi, buildings and upgrades. you keep achievements and earn whiskers for everything made so far.
                  {whiskerGain > 0 ? ` right now that would be +${whiskerGain}.` : ` next whisker at ${fmt(nextWhiskerAt)} lifetime mochi (${fmt(lifetimeAll)} so far).`}
                </div>
              </div>
              <button type="button" onClick={rebirth} disabled={whiskerGain === 0} className="btn text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                {confirmLife ? "really? everything resets" : `use a life (+${whiskerGain})`}
              </button>
            </div>
          </Window>
        </div>

        {/* shop */}
        <Window
          title={
            <span className="flex gap-2">
              {(["shop", "upgrades", "badges"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} className={`cursor-pointer ${tab === t ? "text-accent underline" : "text-ink-soft hover:text-ink"}`}>
                  {t}
                  {t === "upgrades" && visibleUpgrades.some((u) => save.mochi >= u.cost) ? " •" : ""}
                </button>
              ))}
            </span>
          }
          bodyClassName="p-2"
        >
          {tab === "shop" && (
            <ul className="grid gap-1">
              {BUILDINGS.map((b, i) => {
                const owned = save.owned[b.id] ?? 0;
                const cost = buildingCost(b, owned);
                const prev = i === 0 ? 1 : save.owned[BUILDINGS[i - 1].id] ?? 0;
                const known = owned > 0 || prev > 0 || save.earned >= b.cost / 4;
                if (!known) return null;
                const can = save.mochi >= cost;
                return (
                  <li key={b.id}>
                    <button type="button" onClick={() => buy(b)} disabled={!can} title={b.blurb} className={`w-full flex items-center gap-2 border p-1.5 text-left text-[11px] transition-colors ${can ? "border-line bg-paper-2 hover:border-accent cursor-pointer" : "border-dashed border-line opacity-60 cursor-not-allowed"}`}>
                      <PixelIcon8 name={b.id} scale={3} className="shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="pixel text-ink block truncate">{b.name}</span>
                        <span className={`block ${can ? "text-accent-2" : "text-ink-soft"}`}>{fmt(cost)} mochi</span>
                        {owned > 0 && <span className="block text-[10px] text-ink-soft">{fmt(buildingCps(save, b), true)}/s total · {fmt(buildingCps(save, b) / owned, true)} each</span>}
                      </span>
                      <span className="pixel text-lg text-ink-soft shrink-0">{owned || ""}</span>
                    </button>
                  </li>
                );
              })}
              {save.earned < BUILDINGS[0].cost / 4 && <li className="text-[10px] text-ink-soft p-1">click mochi a few times and the shop fills up.</li>}
            </ul>
          )}
          {tab === "upgrades" && (
            <ul className="grid grid-cols-4 gap-1">
              {visibleUpgrades.map((u) => {
                const can = save.mochi >= u.cost;
                const icon = u.kind === "building" ? u.building! : u.kind === "click" ? "paw" : "heart";
                return (
                  <li key={u.id}>
                    <button type="button" onClick={() => buyUpgrade(u)} disabled={!can} title={`${u.name}: ${u.blurb} (${fmt(u.cost)} mochi)`} className={`w-full grid place-items-center gap-0.5 border p-1 text-[9px] ${can ? "border-line bg-paper-2 hover:border-accent cursor-pointer" : "border-dashed border-line opacity-50 cursor-not-allowed"}`}>
                      <PixelIcon8 name={icon} scale={3} />
                      <span className="truncate w-full text-center">{fmt(u.cost)}</span>
                    </button>
                  </li>
                );
              })}
              {visibleUpgrades.length === 0 && <li className="col-span-4 text-[10px] text-ink-soft p-1">nothing to upgrade yet. buy things first.</li>}
            </ul>
          )}
          {tab === "badges" && (
            <div className="grid gap-1">
              <div className="text-[10px] text-ink-soft px-1">{save.achievements.length} / {ACHIEVEMENTS.length} · each one adds 1% production</div>
              <ul className="grid grid-cols-5 gap-1">
                {ACHIEVEMENTS.map((a) => {
                  const got = save.achievements.includes(a.id);
                  return (
                    <li key={a.id} title={got ? `${a.name}: ${a.blurb}` : `???: ${a.blurb}`} className={`grid place-items-center border p-1 ${got ? "border-line bg-paper-2" : "border-dashed border-line opacity-40"}`}>
                      <PixelIcon8 name={got ? (a.id.startsWith("own-") ? a.id.slice(4) : a.id.startsWith("golden") ? "golden" : a.id.startsWith("life") ? "whisker" : a.id === "nya" ? "heart" : "paw") : "lock"} scale={3} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Window>
      </div>

      <p className="text-[10px] text-ink-soft">
        saved in your browser, nothing else. {save.clicks > 0 && `you clicked ${fmt(save.clicks)} times and made ${fmt(lifetimeAll)} mochi in total.`} golden mochi shows up now and then, catch it.
      </p>
    </div>
  );
}

function Stat({ label, value, note, big }: { label: string; value: string; note?: string; big?: boolean }) {
  return (
    <div className="border border-dashed border-line bg-paper-2 px-2.5 py-2 min-w-0">
      <div className="text-[10px] text-ink-soft">{label}</div>
      <div className={`pixel truncate ${big ? "text-2xl text-accent" : "text-base text-ink"}`}>{value}</div>
      {note && <div className="text-[10px] text-accent-2 truncate">{note}</div>}
    </div>
  );
}
