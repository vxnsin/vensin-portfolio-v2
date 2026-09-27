"use client";

import { useActionState } from "react";
import { saveAboutAction, type ActionState } from "../actions";
import type { AboutContent } from "@/lib/about";
import { Window } from "@/components/layout/Window";

/** everything the about page says, one field per block. lists are one item per line, the timeline is "year | text". */
export function AboutForm({ about }: { about: AboutContent }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAboutAction, null);
  return (
    <form action={action} className="grid gap-4 text-xs">
      <Window title="intro (blank line between paragraphs)" dashed>
        <textarea name="intro" rows={8} defaultValue={about.intro.join("\n\n")} className="input" />
      </Window>
      <div className="grid gap-4 sm:grid-cols-2">
        <Window title="currently learning" dashed>
          <input name="learning" maxLength={140} defaultValue={about.learning} className="input" />
        </Window>
        <Window title="quotes (text | who said it, one per line · a random one per page load)" dashed>
          <textarea name="quotes" rows={6} defaultValue={about.quotes.map((q) => `${q.text} | ${q.by}`).join("\n")} className="input font-mono" placeholder={"el psy kongroo | steins;gate\n..."} />
        </Window>
        <Window title="likes (one per line)" dashed>
          <textarea name="likes" rows={6} defaultValue={about.likes.join("\n")} className="input font-mono" />
        </Window>
        <Window title="dislikes (one per line)" dashed>
          <textarea name="dislikes" rows={6} defaultValue={about.dislikes.join("\n")} className="input font-mono" />
        </Window>
        <Window title="ask me about (one per line)" dashed>
          <textarea name="askMeAbout" rows={5} defaultValue={about.askMeAbout.join("\n")} className="input font-mono" />
        </Window>
      </div>
      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>saved ✓</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "saving…" : "save →"}
      </button>
    </form>
  );
}
