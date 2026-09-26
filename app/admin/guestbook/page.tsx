import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { guestbookCounts, listGuestbook, type GuestbookStatus } from "@/lib/guestbook";
import { discordButtonsConfigured, guestbookChannelConfigured } from "@/lib/discord-notify";
import { deleteGuestbookAction, setGuestbookStatusAction } from "../actions";

export const dynamic = "force-dynamic";

const FILTERS: Array<GuestbookStatus | "all"> = ["pending", "approved", "rejected", "all"];

export default async function AdminGuestbook({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status = (FILTERS.includes(raw as GuestbookStatus) ? raw : "pending") as GuestbookStatus | "all";
  const [entries, counts] = [listGuestbook({ status, limit: 200 }), guestbookCounts()];

  return (
    <div className="grid gap-3">
      <h2 className="pixel text-accent">guestbook</h2>
      <p className="text-xs text-ink-soft">
        entries that pass every filter go straight to the wall{guestbookChannelConfigured() ? " and to your guestbook channel" : " (set DISCORD_GUESTBOOK_CHANNEL_ID to get those in a channel instead of your dms)"}. anything with links or spam words waits here and in your discord dms
        {discordButtonsConfigured() ? " (buttons are live)." : " (set DISCORD_PUBLIC_KEY and the interactions url to get buttons)."}
      </p>
      <div className="flex gap-2 flex-wrap text-xs">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/guestbook?status=${f}`} className={`chip no-underline ${status === f ? "bg-accent-soft" : ""}`}>
            {f} {f === "all" ? counts.approved + counts.pending + counts.rejected : counts[f]}
          </Link>
        ))}
      </div>

      {entries.length === 0 && <p className="text-xs text-ink-soft">nothing here.</p>}
      <ul className="grid gap-3">
        {entries.map((e) => (
          <li key={e.id} className="win win-dashed" style={{ opacity: e.status === "rejected" ? 0.6 : 1 }}>
            <div className="win-title">
              <span className="dots" aria-hidden>
                <i style={{ background: e.status === "approved" ? "var(--ok)" : e.status === "pending" ? "var(--idle)" : "var(--dnd)" }} />
                <i />
                <i />
              </span>
              <span className="flex-1 truncate">
                {e.name}
                {e.website && (
                  <>
                    {" · "}
                    <a href={e.website} target="_blank" rel="noreferrer nofollow">
                      {e.website}
                    </a>
                  </>
                )}
              </span>
              <span className="text-[10px] text-ink-soft">{new Date(e.createdAt).toLocaleString("de-DE")}</span>
            </div>
            <div className="win-body text-xs grid gap-2">
              <p className="whitespace-pre-wrap break-words">{e.message}</p>
              {e.reasons.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {e.reasons.map((r) => (
                    <span key={r} className="chip text-[10px]">
                      {r}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {e.status !== "approved" && (
                  <form action={setGuestbookStatusAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="btn text-[11px]" style={{ color: "var(--ok)" }}>
                      approve
                    </button>
                  </form>
                )}
                {e.status !== "rejected" && (
                  <form action={setGuestbookStatusAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className="btn text-[11px]">
                      {e.status === "approved" ? "take down" : "reject"}
                    </button>
                  </form>
                )}
                <form action={deleteGuestbookAction}>
                  <input type="hidden" name="id" value={e.id} />
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
