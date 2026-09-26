"use client";

import { useActionState } from "react";
import { addNeighborAction, type ActionState } from "../actions";

export function NeighborForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(addNeighborAction, null);
  return (
    <form action={action} className="grid gap-3 text-xs sm:grid-cols-2">
      <label className="grid gap-1">
        <span className="text-ink-soft">name</span>
        <input name="name" required maxLength={60} className="input" placeholder="kel's place" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">site url</span>
        <input name="url" type="url" required maxLength={200} className="input" placeholder="https://…" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">button image url (88x31)</span>
        <input name="buttonUrl" type="url" maxLength={300} className="input" placeholder="https://…/button.gif" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">…or upload the button file</span>
        <input name="file" type="file" accept="image/*" className="input" />
      </label>
      {state?.error && <p className="text-[var(--dnd)] sm:col-span-2">{state.error}</p>}
      {state?.ok && (
        <p className="sm:col-span-2" style={{ color: "var(--ok)" }}>
          added ✓
        </p>
      )}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "adding…" : "add →"}
      </button>
    </form>
  );
}
