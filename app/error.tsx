"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Window } from "@/components/layout/Window";
import { LostCat } from "@/components/widgets/LostCat";

/** something threw while rendering a page. the shell around it survives, so this sits inside the normal layout. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">500.</h2>
        <p className="text-xs text-ink-soft">something on my end fell over. the cat has been informed.</p>
      </div>
      <Window title="this page could not load" dashed>
        <div className="flex items-center gap-5 flex-wrap">
          <LostCat />
          <div className="grid gap-2 text-xs min-w-0 flex-1">
            <div className="pixel text-4xl text-[var(--dnd)] leading-none">oops</div>
            <p className="text-ink-soft">
              a server error occurred while building this page. usually a reload fixes it; if not, the rest of the site still works.
              {error.digest && (
                <>
                  {" "}
                  error id <span className="chip text-[10px]">{error.digest}</span>
                </>
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={reset} className="btn">
                try again
              </button>
              <Link href="/" className="btn no-underline">
                home
              </Link>
              <Link href="/contact" className="btn no-underline">
                tell me
              </Link>
            </div>
          </div>
        </div>
      </Window>
      <p className="text-[10px] text-ink-soft text-center">(ノಠ益ಠ)ノ彡┻━┻</p>
    </div>
  );
}
