"use client";

import { useActionState } from "react";
import { saveSetupAction, type ActionState } from "../actions";
import { SETUP_CATEGORIES, type SetupItem } from "@/lib/setup-data";
import { Window } from "@/components/layout/Window";

export function SetupForm({ item }: { item?: SetupItem }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSetupAction, null);
  return (
    <form action={action} className="grid gap-3 text-xs">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Window title={item ? `edit · ${item.name}` : "new item"} dashed>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-ink-soft">name</span>
            <input name="name" required maxLength={80} defaultValue={item?.name} className="input" placeholder="Keychron K2" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">category</span>
            <input name="category" required maxLength={30} defaultValue={item?.category ?? "desk"} list="setup-categories" className="input" />
            <datalist id="setup-categories">
              {SETUP_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">note (why this one, what you like or hate about it)</span>
            <textarea name="note" rows={2} maxLength={300} defaultValue={item?.note} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">link (optional)</span>
            <input name="url" maxLength={300} defaultValue={item?.url ?? ""} className="input" placeholder="https://" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">image url (optional)</span>
            <input name="image" maxLength={300} defaultValue={item?.image ?? ""} className="input" placeholder="https://" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-ink-soft">or upload a picture (replaces the image url)</span>
            <input name="imageFile" type="file" accept="image/*,.heic,.heif" className="input" />
          </label>
        </div>
      </Window>
      {state?.error && <p className="text-[var(--dnd)]">{state.error}</p>}
      {state?.ok && <p style={{ color: "var(--ok)" }}>saved ✓</p>}
      <button type="submit" disabled={pending} className="btn w-fit disabled:opacity-60">
        {pending ? "saving…" : item ? "save changes →" : "add item →"}
      </button>
    </form>
  );
}
