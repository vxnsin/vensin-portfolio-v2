import type { Metadata } from "next";
import Link from "next/link";
import { countGuestbook, listGuestbook } from "@/lib/guestbook";
import { Window } from "@/components/layout/Window";
import { GuestbookForm } from "@/components/guestbook/GuestbookForm";
import { resolveSeason } from "@/lib/season";

export const metadata: Metadata = { title: "guestbook", description: "Leave a note on the wall." };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

const host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default async function GuestbookPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: raw } = await searchParams;
  const total = countGuestbook("approved");
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(raw) || 1));
  const entries = listGuestbook({ status: "approved", limit: PER_PAGE, offset: (page - 1) * PER_PAGE });
  // on special days someone has always just signed, right at the top of page one (not stored, just rendered)
  const { season } = await resolveSeason();
  const pinned =
    page !== 1
      ? null
      : season === "christmas"
        ? {
            icon: "🎄",
            name: "Santa Claus",
            from: "north pole",
            text: "ho ho ho! checked the list twice, luis is on the nice one this year. the cookies by the keyboard were excellent. merry christmas to everyone reading this, and go easy on the anime backlog over the holidays. sleigh's waiting, gotta go!",
            empty: "santa is lonely up there. sign below!",
          }
        : season === "aprilfools"
          ? {
              icon: "🃏",
              name: "the website",
              from: "localhost",
              text: "i signed my own guestbook. what are you going to do about it. also your shoelace is untied. also the button you are about to click is a little shy today.",
              empty: "even the website signed. your turn.",
            }
          : null;

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">guestbook.</h2>
        <p className="text-xs text-ink-soft">
          the wall by the door. leave a note, say where you came from, drop your site. {total === 1 ? "one signature" : `${total} signatures`} so far.
        </p>
      </div>

      <Window title="sign it" dashed>
        <GuestbookForm />
      </Window>

      <Window title={`the wall${pages > 1 ? ` · page ${page}/${pages}` : ""}`}>
        {pinned && (
          <div className="border-2 border-dashed border-accent bg-accent-soft/60 p-3 grid gap-1 text-xs mb-3">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="pixel text-accent text-[10px]">{pinned.icon} pinned</span>
              <span className="pixel text-ink">{pinned.name}</span>
              <span className="text-[11px] text-ink-soft">{pinned.from}</span>
              <span className="ml-auto text-[10px] text-ink-soft">just now</span>
            </div>
            <p>{pinned.text}</p>
          </div>
        )}
        {entries.length === 0 ? (
          <p className="text-xs text-ink-soft py-4 text-center">{pinned ? pinned.empty : "nobody has signed yet. be the first _(:з)∠)_"}</p>
        ) : (
          <ol className="grid gap-3 text-xs">
            {entries.map((e, i) => (
              <li key={e.id} className="border border-dashed border-line bg-paper-2 p-3 grid gap-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="pixel text-accent-2 text-[10px]">#{total - (page - 1) * PER_PAGE - i}</span>
                  <span className="pixel text-ink">{e.name}</span>
                  {e.website && (
                    <a href={e.website} target="_blank" rel="noreferrer nofollow ugc" className="text-[11px] truncate max-w-[60%]">
                      {host(e.website)} ↗
                    </a>
                  )}
                  <span className="ml-auto text-[10px] text-ink-soft">{new Date(e.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                </div>
                <p className="whitespace-pre-wrap break-words">{e.message}</p>
              </li>
            ))}
          </ol>
        )}
        {pages > 1 && (
          <div className="flex justify-between mt-3 text-xs">
            {page > 1 ? <Link href={`/guestbook?page=${page - 1}`} className="btn no-underline">← newer</Link> : <span />}
            {page < pages ? <Link href={`/guestbook?page=${page + 1}`} className="btn no-underline">older →</Link> : <span />}
          </div>
        )}
      </Window>
    </div>
  );
}
