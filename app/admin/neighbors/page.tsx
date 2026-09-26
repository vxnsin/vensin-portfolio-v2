/* eslint-disable @next/next/no-img-element */
import { requireAdmin } from "@/lib/auth";
import { listNeighbors } from "@/lib/store";
import { deleteNeighborAction, moveNeighborAction } from "../actions";
import { NeighborForm } from "./NeighborForm";
import { Window } from "@/components/layout/Window";

export const dynamic = "force-dynamic";

export default async function AdminNeighbors() {
  await requireAdmin();
  const neighbors = await listNeighbors();

  return (
    <div className="grid gap-4">
      <Window title="add a neighbor (88x31 button)" dashed>
        <NeighborForm />
      </Window>

      <h2 className="pixel text-accent">neighbors ({neighbors.length})</h2>
      {neighbors.length === 0 && <p className="text-xs text-ink-soft">no neighbors yet. add friends&apos; sites with their 88x31 buttons.</p>}
      <ul className="grid gap-2 text-xs">
        {neighbors.map((n, i) => (
          <li key={n.id} className="flex items-center gap-3 border-b border-dashed border-line pb-2">
            <img src={n.buttonUrl} alt={n.name} width={88} height={31} className="border border-line" style={{ imageRendering: "pixelated" }} />
            <div className="min-w-0 flex-1">
              <div className="truncate">{n.name}</div>
              <a href={n.url} target="_blank" rel="noreferrer" className="text-[10px] truncate block">
                {n.url}
              </a>
            </div>
            <form action={moveNeighborAction}>
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="dir" value="up" />
              <button type="submit" disabled={i === 0} className="btn text-[11px] disabled:opacity-40">
                ↑
              </button>
            </form>
            <form action={moveNeighborAction}>
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="dir" value="down" />
              <button type="submit" disabled={i === neighbors.length - 1} className="btn text-[11px] disabled:opacity-40">
                ↓
              </button>
            </form>
            <form action={deleteNeighborAction}>
              <input type="hidden" name="id" value={n.id} />
              <button type="submit" className="btn text-[11px]" style={{ color: "var(--dnd)" }}>
                ✕
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
