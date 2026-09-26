"use client";

import { createContext, useContext, type ReactNode } from "react";
import { site } from "@/data/site";
import { useLanyard } from "./useLanyard";
import type { LanyardData } from "./schemas";

type Ctx = { data: LanyardData | null; live: boolean };
const LanyardContext = createContext<Ctx>({ data: null, live: false });

/** One Lanyard connection shared by every widget on the page. */
export function LanyardProvider({ children }: { children: ReactNode }) {
  const value = useLanyard(site.discordUserId);
  return <LanyardContext.Provider value={value}>{children}</LanyardContext.Provider>;
}

export const useLanyardContext = () => useContext(LanyardContext);
