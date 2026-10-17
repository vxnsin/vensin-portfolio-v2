"use client";

import { useActionState, useState } from "react";
import { saveFolderAction, type ActionState } from "../actions";
import { FOLDER_ICONS, ICON_LABEL, type FolderIcon } from "@/lib/gallery-icons";
import { FolderGlyph } from "@/components/gallery/FolderGlyph";

export type FolderOption = { id: string; label: string };
export type FolderValues = { id?: string; parentId: string | null; name: string; icon: FolderIcon; exclusive: boolean; unlisted: boolean };

/** create or edit one folder. `parents` excludes the folder itself and its subfolders when editing. */
export function FolderForm({ folder, parents, onDone }: { folder?: FolderValues; parents: FolderOption[]; onDone?: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const res = await saveFolderAction(prev, fd);
    if (res?.ok) onDone?.();
    return res;
  }, null);
  const [icon, setIcon] = useState<FolderIcon>(folder?.icon ?? "folder");
  return (
    <form action={action} className="grid gap-2 text-xs sm:grid-cols-[auto_1fr_1fr] items-end">
      {folder?.id && <input type="hidden" name="id" value={folder.id} />}
      <div className="row-span-2 hidden sm:grid place-items-center border border-dashed border-line bg-paper-2 p-2 self-stretch">
        <FolderGlyph icon={icon} scale={3} />
      </div>
      <label className="grid gap-1">
        <span className="text-ink-soft">name</span>
        <input name="name" required maxLength={40} defaultValue={folder?.name} className="input" placeholder="night rides" />
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">inside</span>
        <select name="parent" defaultValue={folder?.parentId ?? ""} className="input">
          <option value="">(top level)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="text-ink-soft">icon</span>
        <select name="icon" value={icon} onChange={(e) => setIcon(e.target.value as FolderIcon)} className="input">
          {FOLDER_ICONS.map((i) => (
            <option key={i} value={i}>
              {ICON_LABEL[i]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-1">
        <label className="flex items-center gap-2 cursor-pointer" title="photos in here do not show up in 'all' or the folders above, only when this folder is opened">
          <input type="checkbox" name="exclusive" defaultChecked={folder?.exclusive} /> only here (not in &quot;all&quot;)
        </label>
        <label className="flex items-center gap-2 cursor-pointer" title="left out of the tree; people with the link can still open it. not a password.">
          <input type="checkbox" name="unlisted" defaultChecked={folder?.unlisted} /> unlisted (link only)
        </label>
      </div>
      <div className="flex items-center gap-2 sm:col-span-3">
        <button type="submit" disabled={pending} className="btn text-xs disabled:opacity-60">
          {pending ? "saving…" : folder?.id ? "save folder" : "create folder"}
        </button>
        {onDone && folder?.id && (
          <button type="button" onClick={onDone} className="text-[11px] text-ink-soft hover:text-accent cursor-pointer">
            cancel
          </button>
        )}
        {state?.error && <span style={{ color: "var(--dnd)" }}>{state.error}</span>}
        {state?.ok && !folder?.id && <span style={{ color: "var(--ok)" }}>created ✓</span>}
      </div>
    </form>
  );
}

/** one row in the folder list, with an inline editor; clicking the name opens its contents below */
export function FolderRow({ folder, depth, parents, count, href, manageHref, selected, children }: { folder: FolderValues & { id: string }; depth: number; parents: FolderOption[]; count: number; href: string; manageHref: string; selected: boolean; children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  return (
    <li className={`border bg-paper-2 p-2 ${selected ? "border-accent" : "border-dashed border-line"}`} style={{ marginLeft: depth * 18 }}>
      {editing ? (
        <FolderForm folder={folder} parents={parents} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex items-center gap-2 text-xs min-w-0">
          <FolderGlyph icon={folder.icon} scale={2} open={selected} />
          <a href={manageHref} className={`pixel truncate no-underline hover:text-accent ${selected ? "text-accent" : "text-ink"}`} aria-current={selected ? "true" : undefined} title="manage what is in this folder">
            {folder.name}
          </a>
          <span className="text-ink-soft shrink-0">{count}</span>
          <a href={href} target="_blank" rel="noreferrer" className="text-[10px] text-ink-soft no-underline hover:text-accent shrink-0" title="open the public page">
            ↗
          </a>
          {folder.exclusive && <span className="chip text-[9px]">only here</span>}
          {folder.unlisted && <span className="chip text-[9px]">unlisted</span>}
          <span className="ml-auto flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setEditing(true)} className="btn text-[10px]">
              edit
            </button>
            {children}
          </span>
        </div>
      )}
    </li>
  );
}
