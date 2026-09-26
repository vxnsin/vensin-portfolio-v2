"use client";

import { useActionState } from "react";
import { sendMessage, type ContactState } from "@/app/contact/actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, null);

  if (state?.ok) {
    return (
      <div className="text-center py-6">
        <div className="pixel text-accent text-lg">{"sent! ヽ(>∀<☆)ノ"}</div>
        <p className="text-xs text-ink-soft mt-1">my discord just went ping. i&apos;ll get back to you.</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3 text-xs">
      <label className="grid gap-1">
        <span className="text-ink-soft">name</span>
        <input name="name" required maxLength={80} className="input" autoComplete="name" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">email (so i can answer)</span>
        <input name="email" type="email" required maxLength={120} className="input" autoComplete="email" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">message</span>
        <textarea name="message" required minLength={5} maxLength={2000} rows={6} className="input" />
      </label>
      {/* honeypot, hidden from humans */}
      <label className="hidden" aria-hidden>
        website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn disabled:opacity-60">
          {pending ? "sending…" : "send →"}
        </button>
        <span className="text-[10px] text-ink-soft">your name, email and message are stored so i can reply. nothing else.</span>
      </div>
    </form>
  );
}
