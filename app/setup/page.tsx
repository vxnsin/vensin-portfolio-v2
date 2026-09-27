/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { groupedSetup } from "@/lib/setup";
import { Window } from "@/components/layout/Window";

export const metadata: Metadata = { title: "setup", description: "What's on the desk, in the bag and in the garage." };
export const dynamic = "force-dynamic";

export default function SetupPage() {
  const groups = groupedSetup();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">setup.</h2>
        <p className="text-xs text-ink-soft">what i build with, listen with and ride. {total === 0 ? "still being written down." : `${total} things, no affiliate links, just what i actually use.`}</p>
      </div>
      {groups.length === 0 && (
        <Window title="coming soon" dashed>
          <p className="text-xs text-ink-soft">the desk is real, the list is not yet. check back in a bit.</p>
        </Window>
      )}
      {groups.map((g) => (
        <Window key={g.category} title={`${g.category} · ${g.items.length}`} dashed>
          <ul className="grid gap-3 sm:grid-cols-2">
            {g.items.map((it) => (
              <li key={it.id} className="flex gap-3 border border-dashed border-line bg-paper-2 p-2.5 text-xs">
                {it.image ? (
                  <img src={it.image} alt="" className="w-16 h-16 object-cover border border-line shrink-0" loading="lazy" />
                ) : (
                  <div className="w-16 h-16 border border-dashed border-line shrink-0 grid place-items-center text-ink-soft text-[10px]">no pic</div>
                )}
                <div className="min-w-0">
                  <div className="pixel text-ink">
                    {it.url ? (
                      <a href={it.url} target="_blank" rel="noreferrer nofollow" className="no-underline text-ink hover:text-accent">
                        {it.name} ↗
                      </a>
                    ) : (
                      it.name
                    )}
                  </div>
                  {it.note && <p className="text-ink-soft mt-0.5 whitespace-pre-wrap">{it.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </Window>
      ))}
    </div>
  );
}
