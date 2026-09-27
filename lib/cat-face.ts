// Mochi's face as a small grid, for the favicon, the apple touch icon and the home page's social card.
// Same colours as the sidebar sprite (components/widgets/cat-frames.tsx), cropped to the head.

export const CAT_FACE = [
  ".k.....k..",
  "kok...kok.",
  "kooooooook",
  "kokooookok",
  "kooowwoook",
  ".koooooook",
  ".kkkkkkkk.",
];

const PIX: Record<string, string> = { k: "#3b2c3a", o: "#e9a552", w: "#fff4e6", p: "#ff8fb4" };

/** the grid as an svg data uri; `scale` is pixels per cell */
export function catFaceSvg(grid: string[], scale = 4): string {
  const w = grid[0].length;
  const h = grid.length;
  let rects = "";
  grid.forEach((row, y) => [...row].forEach((c, x) => { if (PIX[c]) rects += `<rect x='${x}' y='${y}' width='1' height='1' fill='${PIX[c]}'/>`; }));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w * scale}' height='${h * scale}' shape-rendering='crispEdges'>${rects}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
