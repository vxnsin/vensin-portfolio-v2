"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { nav } from "@/data/site";

export function NavTabs() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  // on a phone the row scrolls sideways; make sure the current tab is not hiding off-screen
  useEffect(() => {
    const active = ref.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (active && ref.current && ref.current.scrollWidth > ref.current.clientWidth) active.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);
  return (
    <nav ref={ref} aria-label="main" className="nav-tabs flex gap-1 px-2 overflow-x-auto">
      {nav.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className="tab shrink-0" aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
