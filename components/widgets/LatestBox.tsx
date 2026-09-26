"use client";

import { useLanyardContext } from "@/components/discord/LanyardProvider";
import { KIND_LABEL, KIND_ORDER, resolveAll, type Kind } from "@/components/discord/activities";
import type { Latest } from "@/lib/store";

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`;
}

type Row = { kind: Kind; label: string; value: string; live: boolean; at?: string; href?: string | null };

/** what's running right now, otherwise the last thing that was. */
export function LatestBox({ latest }: { latest: Latest }) {
  const { data } = useLanyardContext();
  const live = data ? resolveAll(data.activities) : [];

  const rows: Row[] = [];
  for (const kind of KIND_ORDER) {
    if (kind === "browsing") continue; // not worth remembering
    const now = live.find((r) => r.info.kind === kind && r.info.latest);
    if (now) {
      rows.push({ kind, label: KIND_LABEL[kind].live, value: now.info.latest!.value, href: now.info.latest!.href, live: true });
      continue;
    }
    const past = latest.items?.[kind];
    if (past) rows.push({ kind, label: KIND_LABEL[kind].past, value: past.value, href: past.href, live: false, at: past.at });
  }

  if (rows.length === 0) return <p className="text-xs text-ink-soft">nothing recorded yet. give it a moment.</p>;

  return (
    <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
      {rows.map((r) => (
        <div key={r.kind} className="contents">
          <dt className="text-ink-soft">{r.label}:</dt>
          <dd className="min-w-0">
            <div className="truncate" title={r.value}>
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer">
                  {r.value}
                </a>
              ) : (
                r.value
              )}
              {r.live && (
                <span className="ml-1 text-[9px] align-middle" style={{ color: "var(--ok)" }} title="live from discord">
                  ●
                </span>
              )}
            </div>
            {!r.live && r.at && <div className="text-[10px] text-ink-soft">{ago(r.at)}</div>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
