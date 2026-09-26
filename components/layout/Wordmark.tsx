import { site } from "@/data/site";

// DotGothic16 is fixed-pitch, so a full stop sits in a whole cell with a big empty right half.
// The margins pull the neighbours in so "vensin.dev" reads as one word.
export function Wordmark({ text = site.domain }: { text?: string }) {
  const parts = text.split(".");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="inline-block -ml-[0.03em] -mr-[0.28em]">.</span>}
          {p}
        </span>
      ))}
    </>
  );
}
