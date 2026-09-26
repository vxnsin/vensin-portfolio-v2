import { requireAdmin } from "@/lib/auth";
import { getSettingsFresh } from "@/lib/store";
import { addUpdateAction, deleteUpdateAction } from "../actions";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

export default async function AdminUpdates() {
  await requireAdmin();
  const { updateLog } = await getSettingsFresh();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-4">
      <Window title="new entry" dashed>
        <form action={addUpdateAction} className="grid gap-3 text-xs sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <label className="grid gap-1">
            <span className="text-ink-soft">date</span>
            <input name="date" type="date" defaultValue={today} className="input" />
          </label>
          <label className="grid gap-1">
            <span className="text-ink-soft">text</span>
            <input name="text" required maxLength={300} className="input" placeholder="added the gallery page" />
          </label>
          <button type="submit" className="btn">
            add →
          </button>
        </form>
      </Window>

      <h2 className="pixel text-accent">update log ({updateLog.length})</h2>
      <ul className="grid gap-1.5 text-xs">
        {updateLog.map((u) => (
          <li key={u.id} className="flex items-start gap-2 border-b border-dashed border-line pb-1.5">
            <span className="text-accent-2 italic shrink-0">{u.date}</span>
            <span className="flex-1">{u.text}</span>
            <form action={deleteUpdateAction}>
              <input type="hidden" name="id" value={u.id} />
              <button type="submit" className="text-[10px] cursor-pointer" style={{ color: "var(--dnd)" }}>
                delete
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
