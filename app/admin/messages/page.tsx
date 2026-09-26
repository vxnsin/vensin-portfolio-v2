import { requireAdmin } from "@/lib/auth";
import { listMessages } from "@/lib/store";
import { deleteMessageAction, toggleReadAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  await requireAdmin();
  const messages = await listMessages();

  return (
    <div className="grid gap-3">
      <h2 className="pixel text-accent">messages ({messages.length})</h2>
      {messages.length === 0 && <p className="text-xs text-ink-soft">inbox zero. nice.</p>}
      <ul className="grid gap-3">
        {messages.map((m) => (
          <li key={m.id} className="win win-dashed" style={{ opacity: m.read ? 0.7 : 1 }}>
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i style={{ background: m.read ? "var(--off)" : "var(--accent)" }} />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">
                {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>
              </span>
              <span className="text-[10px] text-ink-soft">{new Date(m.createdAt).toLocaleString("de-DE")}</span>
            </div>
            <div className="win-body text-xs grid gap-2">
              <p className="whitespace-pre-wrap">{m.message}</p>
              <div className="flex gap-2">
                <a href={`mailto:${m.email}?subject=re: your message on vensin.dev`} className="btn text-[11px] no-underline">
                  reply ↗
                </a>
                <form action={toggleReadAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                  <button type="submit" className="btn text-[11px]">
                    {m.read ? "mark unread" : "mark read"}
                  </button>
                </form>
                <form action={deleteMessageAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="btn text-[11px]" style={{ color: "var(--dnd)" }}>
                    delete
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
