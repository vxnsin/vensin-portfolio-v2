import Link from "next/link";
import { Window } from "@/components/layout/Window";
import { LostCat } from "@/components/widgets/LostCat";

const LINES = [
  "this page wandered off. mochi went looking for it.",
  "the page is not here, but the cat is.",
  "nothing at this address. probably never was, or i moved it and forgot.",
  "you found the edge of the site. there is no fence, just this cat.",
];

export default function NotFound() {
  const line = LINES[new Date().getDate() % LINES.length];
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">404.</h2>
        <p className="text-xs text-ink-soft">{line}</p>
      </div>
      <Window title="page not found" dashed>
        <div className="flex items-center gap-5 flex-wrap">
          <LostCat />
          <div className="grid gap-2 text-xs min-w-0 flex-1">
            <div className="pixel text-4xl text-accent-2 leading-none">4 0 4</div>
            <p className="text-ink-soft">the url looks fine, the page just isn&apos;t behind it. try one of these instead:</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/" className="btn no-underline">
                home
              </Link>
              <Link href="/projects" className="btn no-underline">
                projects
              </Link>
              <Link href="/anime" className="btn no-underline">
                anime
              </Link>
              <Link href="/guestbook" className="btn no-underline">
                tell me what you were looking for
              </Link>
            </div>
          </div>
        </div>
      </Window>
      <p className="text-[10px] text-ink-soft text-center">(´。＿。｀)</p>
    </div>
  );
}
