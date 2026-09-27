import { PIX } from "@/components/widgets/cat-frames";

// Tiny 8x8 pixel icons for the clicker's shop, same palette as mochi herself.

const ICONS: Record<string, string[]> = {
  hand: [".k....k.", "kok..kok", ".k.kk.k.", "..koook.", ".kooooo.", ".koooook", "..kkkkk.", "........"],
  yarn: ["..kkkk..", ".kvvvvk.", "kvlvvvlk", "kvvlvlvk", "kvvvlvvk", "kvlvvlvk", ".kvvvvk.", "..kkkk.."],
  tuna: ["........", ".kkkkkk.", "kmmmmmmk", "kmrrrrmk", "kmrwwrmk", "kmrrrrmk", "kmmmmmmk", ".kkkkkk."],
  tree: ["kkkkkkk.", "kdddddk.", "..kdk...", ".kkkkkk.", ".kdddddk", "...kdk..", "kkkkkkkk", "kddddddk"],
  box: ["........", ".kkkkkk.", "kooooook", "kkkkkkkk", "koddddok", "koddddok", "koddddok", "kkkkkkkk"],
  laser: ["......h.", ".....h..", "....h...", "..kkk...", ".kbbbk..", ".kbbbk..", "..kbk...", "...k...."],
  catnip: ["...k....", "..kgk...", ".kgggk..", "kgkgkgk.", ".kkgkk..", "..kgk...", ".kdddk..", ".kkkkk.."],
  bakery: ["..kkkk..", ".kppppk.", "kppwpppk", "kppppppk", "kppppppk", ".kppppk.", "..kkkk..", "....k..."],
  cafe: ["..l.l...", ".l.l....", ".kkkkkk.", "kwwwwwkk", "kwwwwwkk", "kwwwwwk.", ".kkkkk..", "........"],
  portal: [".kkkkkk.", "kvvvvvvk", "kvllllvk", "kvlmmlvk", "kvlmmlvk", "kvllllvk", "kvvvvvvk", ".kkkkkk."],
  golden: ["..kkkk..", ".knnnnk.", "knnwnnnk", "knnnnnnk", "knnnnnnk", ".knnnnk.", "..kkkk..", "........"],
  paw: ["........", ".k....k.", "kok..kok", ".k.kk.k.", "..koook.", ".kooooo.", ".koooook", "..kkkkk."],
  heart: ["........", ".hh..hh.", "hhhhhhhh", "hhhhhhhh", ".hhhhhh.", "..hhhh..", "...hh...", "........"],
  whisker: ["........", "........", "k......k", ".kk..kk.", "...kk...", ".kk..kk.", "k......k", "........"],
  lock: ["........", "..kkkk..", ".k....k.", ".k....k.", "kkkkkkkk", "kkkwwkkk", "kkkkkkkk", "kkkkkkkk"],
};

export function PixelIcon8({ name, scale = 3, className }: { name: string; scale?: number; className?: string }) {
  const grid = ICONS[name] ?? ICONS.lock;
  return (
    <svg viewBox="0 0 8 8" width={8 * scale} height={8 * scale} shapeRendering="crispEdges" aria-hidden className={className}>
      {grid.flatMap((r, y) => [...r].map((c, x) => (PIX[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PIX[c]} /> : null)))}
    </svg>
  );
}
