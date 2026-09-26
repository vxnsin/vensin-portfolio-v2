"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { site } from "@/data/site";
import { useLanyard } from "./useLanyard";
import type { LanyardData } from "./schemas";

type Ctx = { data: LanyardData | null; live: boolean };
const LanyardContext = createContext<Ctx>({ data: null, live: false });

const PING_MS = 60_000;

/** One Lanyard connection shared by every widget on the page. */
export function LanyardProvider({ children }: { children: ReactNode }) {
  const value = useLanyard(site.discordUserId);
  const lastPing = useRef(0);

  // let the server remember what was running (feeds the "latest" box)
  useEffect(() => {
    if (!value.data) return;
    const now = Date.now();
    if (now - lastPing.current < PING_MS) return;
    lastPing.current = now;
    fetch("/api/latest", { method: "POST", keepalive: true }).catch(() => {});
  }, [value.data]);

  return <LanyardContext.Provider value={value}>{children}</LanyardContext.Provider>;
}

export const useLanyardContext = () => useContext(LanyardContext);
