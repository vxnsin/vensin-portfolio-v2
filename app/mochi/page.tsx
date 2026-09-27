import type { Metadata } from "next";
import { Clicker } from "@/components/mochi/Clicker";
import { kvGet } from "@/lib/db";
import { resolveSeason } from "@/lib/season";

export const metadata: Metadata = {
  title: "mochi clicker",
  description: "click the cat, buy her things, use her nine lives. a small idle game with mochi, the pixel cat.",
};
export const dynamic = "force-dynamic";

export default async function MochiPage() {
  const { season } = await resolveSeason();
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">mochi clicker.</h2>
        <p className="text-xs text-ink-soft">click the cat. buy her things. the things make mochi while you are gone. when it gets silly, use one of her nine lives and start over with whiskers.</p>
      </div>
      <Clicker initialGlobal={kvGet<number>("mochi:clicks", 0)} season={season} />
    </div>
  );
}
