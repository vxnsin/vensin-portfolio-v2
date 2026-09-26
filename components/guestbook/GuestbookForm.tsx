"use client";

import { useActionState } from "react";
import { signGuestbook, type GuestbookState } from "@/app/guestbook/actions";

export function GuestbookForm() {
  const [state, action, pending] = useActionState<GuestbookState, FormData>(signGuestbook, null);

  if (state?.ok) {
    return (
      <div className="text-center py-6">
        <div className="pixel text-accent text-lg">{state.pending ? "got it (｡•̀ᴗ-)✧" : "you're on the wall ヽ(>∀<☆)ノ"}</div>
        <p className="text-xs text-ink-soft mt-1">
          {state.pending ? "your entry tripped one of my spam filters, so it shows up after i've had a quick look." : "thanks for stopping by."}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3 text-xs">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-ink-soft">name</span>
          <input name="name" required maxLength={40} className="input" autoComplete="nickname" />
        </label>
        <label className="grid gap-1">
          <span className="text-ink-soft">website (optional)</span>
          <input name="website" maxLength={120} className="input" placeholder="yoursite.nekoweb.org" autoComplete="url" inputMode="url" />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-ink-soft">message</span>
        <textarea name="message" required minLength={2} maxLength={1000} rows={4} className="input" placeholder="hi from ..." />
      </label>
      {/* honeypot, hidden from humans */}
      <label className="hidden" aria-hidden>
        company
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>

      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}

      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={pending} className="btn disabled:opacity-60">
          {pending ? "signing…" : "sign →"}
        </button>
        <span className="text-[10px] text-ink-soft">
          name, message and website are public. links and anything spammy wait for me to okay them. details in the <a href="/privacy">privacy policy</a>.
        </span>
      </div>
    </form>
  );
}
