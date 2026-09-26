// Platform icons. Paths come from pixelarticons (MIT, halfmage) on a 24x24 grid;
// the Steam mark is traced from the Pixel Art Icons pack by YukiPixels (CC BY-SA 4.0), 28x28.

const PATHS: Record<string, string[]> = {
  instagram: ["M18 22H6v-2h12v2ZM6 20H4v-2h2v2Zm14 0h-2v-2h2v2ZM4 18H2V6h2v12Zm18 0h-2V6h2v12Zm-8-2h-4v-2h4v2Zm-4-2H8v-4h2v4Zm6 0h-2v-4h2v4Zm-2-4h-4V8h4v2Zm4-2h-2V6h2v2ZM6 6H4V4h2v2Zm14 0h-2V4h2v2Zm-2-2H6V2h12v2Z"],
  github: ["M5 2h4v2H7v2H5V2Zm0 10H3V6h2v6Zm2 2H5v-2h2v2Zm2 2v-2H7v2H3v-2H1v2h2v2h4v4h2v-4h2v-2H9Zm0 0v2H7v-2h2Zm6-12v2H9V4h6Zm4 2h-2V4h-2V2h4v4Zm0 6V6h2v6h-2Zm-2 2v-2h2v2h-2Zm-2 2v-2h2v2h-2Zm0 2h-2v-2h2v2Zm0 0h2v4h-2v-4Z"],
  discord: ["M9 21H5v-2h4v2Zm10 0h-4v-2h4v2ZM5 19H3v-2h2v2Zm12-2h-2v2h-2v-2h-2v2H9v-2H7v-2h10v2Zm4 2h-2v-2h2v2ZM3 17H1V7h2v10Zm20 0h-2V7h2v10Zm-12-4H8v-3h3v3Zm5 0h-3v-3h3v3ZM5 7H3V5h2v2Zm10 0H9V5h6v2Zm6 0h-2V5h2v2ZM9 5H5V3h4v2Zm10 0h-4V3h4v2Z"],
  youtube: ["M20 20H4v-2h16v2ZM4 18H2V6h2v12Zm18 0h-2V6h2v12ZM12 9h-2v6h2v2H8V7h4v2Zm3 6h-3v-2h3v2Zm2-2h-2v-2h2v2Zm-2-2h-3V9h3v2Zm5-5H4V4h16v2Z"],
  tiktok: ["M15 22H7v-2h8v2Zm-8-2H5v-2h2v2ZM17 8h2V6h2v4h-4v10h-2V6h2v2ZM5 18H3v-6h2v6ZM17 4h-4v14H9v-2h2v-2H9v-2h2v-2H7V8h4V2h6v2ZM9 16H7v-2h2v2Zm-2-4H5v-2h2v2Zm12-6h-2V4h2v2Z"],
  mail: ["M6 8h2v2H6zm2 2h2v2H8zm10-2h-2v2h2zm-2 2h-2v2h2zm-6 2h4v2h-4zM2 6h2v12H2zm18 0h2v12h-2zM4 4h16v2H4zm0 14h16v2H4z"],
  linux: ["M15 22H9v-2h6v2Zm-6-2H7v-2h2v2Zm8 0h-2v-2h2v2ZM3 14h4v4H5v-2H1v-4h2v2Zm20 2h-4v2h-2v-4h4v-2h2v4Zm-10-3h-2v-2H9V9h6v2h-2v2Zm-8-1H3v-2h2v2Zm16 0h-2v-2h2v2ZM7 10H5V8h2v2Zm12 0h-2V8h2v2ZM9 8H7V4h2v4Zm8 0h-2V4h2v4Zm-2-4H9V2h6v2Z"],
  npm: ["M24 16H12v2H6v-2H0V7h24v9ZM8 16h2v-2h3V9H8v7Zm-6-2h1v-4h2v4h1V9H2v5Zm13 0h1v-4h2v4h1v-4h2v4h1V9h-7v5Zm-3-1h-2v-3h2v3Z"],
  docker: ["M16 20H6v-2h10v2ZM6 18H4v-2h2v2Zm12 0h-2v-2h2v2Zm2-2h-2v-4H4v4H2v-6h16V8h2v8ZM9 15H7v-2h2v2ZM6 8H4V6h2v2Zm3 0H7V6h2v2Zm3 0h-2V6h2v2Zm6 0h-2V6h2v2Zm4 0h-2V6h2v2ZM9 5H7V3h2v2Zm3 0h-2V3h2v2Z"],
};

// pixel grids: "#" is on
const GRIDS: Record<string, string[]> = {
  steam: [
    ".................####....",
    "...............########..",
    "..............###....###.",
    "..............##.####.##.",
    ".............##.######.##",
    ".............##.######.##",
    ".............##.######.##",
    "............###.######.##",
    "............####.####.##.",
    "##.........######....###.",
    "####......#############..",
    "######..#############....",
    "########...#######.......",
    "###########.####.........",
    "..##########.##..........",
    "....########.#...........",
    "......######.#...........",
    "......#.###.##...........",
    ".......#...##............",
    "........####.............",
  ],
};

export function PixelIcon({ name, size = 24, className = "" }: { name: string; size?: number; className?: string }) {
  const paths = PATHS[name];
  if (paths) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" shapeRendering="crispEdges" className={className} aria-hidden>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  }
  const grid = GRIDS[name];
  if (!grid) return <span className={className}>↗</span>;
  const w = Math.max(...grid.map((r) => r.length));
  const h = grid.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={size} height={(size * h) / w} className={className} aria-hidden shapeRendering="crispEdges" fill="currentColor">
      {grid.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  );
}
