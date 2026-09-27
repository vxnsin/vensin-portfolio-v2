import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSetupItem, listSetup } from "@/lib/setup";
import { deleteSetupAction, moveSetupAction } from "../actions";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function AdminSetup({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin();
  const { edit } = await searchParams;
  const items = listSetup();
  const editing = edit ? getSetupItem(edit) : null;

  return (
    <div className="grid gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="pixel text-accent">setup ({items.length})</h2>
        {editing && (
          <Link href="/admin/setup" className="btn text-[11px] no-underline">
            + new item instead
          </Link>
        )}
      </div>
      <p className="text-xs text-ink-soft">everything on /setup, grouped by category. desk, computer, peripherals, audio, mobile, software, motorcycle, everyday carry, misc, or make up your own.</p>

      <SetupForm key={editing?.id ?? "new"} item={editing ?? undefined} />

      <ul className="grid gap-2 text-xs">
        {items.map((it, i) => (
          <li key={it.id} className="win win-dashed">
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">
                <span className="text-ink-soft">{it.category} ·</span> {it.name}
              </span>
            </div>
            <div className="win-body flex gap-2 flex-wrap items-center">
              <span className="text-ink-soft mr-auto truncate">{it.note || "no note"}</span>
              <Link href={`/admin/setup?edit=${it.id}`} className="btn text-[11px] no-underline">
                edit
              </Link>
              <form action={moveSetupAction}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="-1" />
                <button type="submit" className="btn text-[11px]" disabled={i === 0}>
                  ↑
                </button>
              </form>
              <form action={moveSetupAction}>
                <input type="hidden" name="id" value={it.id} />
                <input type="hidden" name="dir" value="1" />
                <button type="submit" className="btn text-[11px]" disabled={i === items.length - 1}>
                  ↓
                </button>
              </form>
              <form action={deleteSetupAction}>
                <input type="hidden" name="id" value={it.id} />
                <button type="submit" className="btn text-[11px]" style={{ color: "var(--dnd)" }}>
                  delete
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
