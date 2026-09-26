"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { site } from "@/data/site";

const SNIPPET = `<a href="${site.url}" title="${site.domain}"><img src="${site.url}/button.png" alt="${site.domain}" width="88" height="31" /></a>`;

export function LinkBack() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="grid gap-3 text-xs">
      <div className="flex items-center gap-4 flex-wrap">
        <img src="/button.svg" alt={site.domain} width={264} height={93} className="border border-line" />
        <div className="grid gap-1">
          <img src="/button.png" alt="" width={88} height={31} className="border border-line" style={{ imageRendering: "pixelated" }} aria-hidden />
          <span className="text-ink-soft">actual size: 88x31 · hotlinking is fine</span>
        </div>
      </div>
      <pre className="border border-dashed border-line bg-paper-2 p-2 overflow-x-auto text-[11px] whitespace-pre-wrap break-all">{SNIPPET}</pre>
      <button type="button" onClick={copy} className="btn w-fit">
        {copied ? "copied ✓" : "copy html"}
      </button>
    </div>
  );
}
