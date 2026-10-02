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

// the same face asleep: eyes shut, used for the tab icon while the tab is in the background
export const CAT_FACE_ASLEEP = [
  ".k.....k..",
  "kok...kok.",
  "kooooooook",
  "kokkookkok",
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

/** the face framed like the favicon (paper background, border), as an svg data uri, for swapping the tab icon at runtime */
export function catFaceIconSvg(grid: string[]): string {
  const size = 64;
  const scale = 5;
  const w = grid[0].length * scale;
  const h = grid.length * scale;
  const ox = Math.floor((size - w) / 2);
  const oy = Math.floor((size - h) / 2);
  let rects = "";
  grid.forEach((row, y) => [...row].forEach((c, x) => { if (PIX[c]) rects += `<rect x='${ox + x * scale}' y='${oy + y * scale}' width='${scale}' height='${scale}' fill='${PIX[c]}'/>`; }));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}' width='${size}' height='${size}' shape-rendering='crispEdges'><rect width='${size}' height='${size}' fill='#1f1826'/><rect x='1.5' y='1.5' width='${size - 3}' height='${size - 3}' fill='none' stroke='#5c4a62' stroke-width='3'/>${rects}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
