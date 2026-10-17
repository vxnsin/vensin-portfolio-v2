import { FOLDER_CLOSED, FOLDER_OPEN, ICON_PIX, SYMBOLS, type FolderIcon } from "@/lib/gallery-icons";

function Grid({ grid, x = 0, y = 0 }: { grid: string[]; x?: number; y?: number }) {
  return (
    <>
      {grid.flatMap((row, gy) => [...row].map((c, gx) => (ICON_PIX[c] ? <rect key={`${x}-${gx}-${gy}`} x={x + gx} y={y + gy} width={1} height={1} fill={ICON_PIX[c]} /> : null)))}
    </>
  );
}

/** a pixel folder in the theme colour, open or closed; the folder's symbol sits on the front corner like a sticker */
export function FolderGlyph({ icon, open = false, scale = 2, className }: { icon: FolderIcon; open?: boolean; scale?: number; className?: string }) {
  const symbol = icon === "folder" ? null : SYMBOLS[icon];
  const w = symbol ? 21 : 17;
  const h = symbol ? 16 : 12;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w * scale} height={h * scale} shapeRendering="crispEdges" aria-hidden className={className}>
      <Grid grid={open ? FOLDER_OPEN : FOLDER_CLOSED} y={symbol ? 4 : 0} />
      {symbol && <Grid grid={symbol} x={11} y={6} />}
    </svg>
  );
}

/** the small icon for the tree: the symbol if the folder has one, otherwise a plain folder */
export function TreeGlyph({ icon, open = false }: { icon: FolderIcon; open?: boolean }) {
  if (icon === "folder") {
    return (
      <svg viewBox="0 0 17 12" width={17} height={12} shapeRendering="crispEdges" aria-hidden className="shrink-0">
        <Grid grid={open ? FOLDER_OPEN : FOLDER_CLOSED} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 10 10" width={15} height={15} shapeRendering="crispEdges" aria-hidden className="shrink-0">
      <Grid grid={SYMBOLS[icon]} />
    </svg>
  );
}
