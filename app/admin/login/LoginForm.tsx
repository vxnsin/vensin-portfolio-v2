"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, null);
  return (
    <form action={action} className="grid gap-3 text-xs">
      <label className="grid gap-1">
        <span className="text-ink-soft">password</span>
        <input name="password" type="password" required autoFocus className="input" autoComplete="current-password" />
      </label>
      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "checking…" : "enter →"}
      </button>
    </form>
  );
}
