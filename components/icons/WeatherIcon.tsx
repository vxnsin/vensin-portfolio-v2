// Weather glyphs on a 24x24 pixel grid. Base shapes come from pixelarticons (MIT, halfmage);
// rain, drizzle, fog, snow and thunder are composed from the cloud plus a few extra pixels.

const CLOUD =
  "M22 10h-4v2h4v-2Zm2 2h-2v6h2v-6Zm-2 6H2v2h20v-2ZM2 12H0v6h2v-6Zm2-2H2v2h2v-2Zm4-2H4v2h4V8Zm8-4h-6v2h6V4Zm-6 2H8v2h2V6Zm0 4H8v2h2v-2Zm8-4h-2v2h2V6ZM20 8h-2v4h2V8Zm-2 4h-2v2h2v-2Z";
const SUN =
  "M13 22h-2v-3h2v3Zm-6-3H5v-2h2v2Zm12 0h-2v-2h2v2Zm-4-2H9v-2h6v2Zm-6-2H7V9h2v6Zm8 0h-2V9h2v6ZM5 13H2v-2h3v2Zm17 0h-3v-2h3v2Zm-7-4H9V7h6v2ZM7 7H5V5h2v2Zm12 0h-2V5h2v2Zm-6-2h-2V2h2v3Z";
const MOON =
  "M18 22H8v-2h10v2ZM8 20H6v-2h2v2Zm12 0h-2v-2h2v2ZM6 18H4v-2h2v2Zm16 0h-2v-4h-2v-2h2v-2h2v8ZM4 16H2V6h2v10Zm14 0h-6v-2h6v2Zm-6-2h-2v-2h2v2Zm-2-2H8V6h2v6ZM6 6H4V4h2v2Zm8-2h-2v2h-2V4H6V2h8v2Z";
const CLOUD_SUN =
  "M14 22H4v-2h10v2ZM4 20H2v-4h2v4Zm12 0h-2v-4h2v4Zm-6-2H8v-2h2v2Zm-2-2H4v-2h4v2Zm6 0h-2v-2h2v2Zm-2-2H8v-2h4v2Zm12-1h-4v-2h4v2Zm-6-1h-2v-2h2v2ZM8 10H6V8h2v2Zm8 0h-2V8h2v2Zm-2-2H8V6h6v2ZM6 6H4V4h2v2Zm14 0h-2V4h2v2ZM4 4H2V2h2v2Zm9 0h-2V0h2v4Zm9 0h-2V2h2v2Z";
const CLOUD_MOON =
  "M14 22H4v-2h10v2ZM4 20H2v-4h2v4Zm12 0h-2v-4h2v4Zm-6-2H8v-2h2v2Zm-2-2H4v-2h4v2Zm6 0h-2v-2h2v2Zm6 0h-2v-2h2v2Zm-8-2H8v-2h4v2Zm10 0h-2v-4h-2V8h2V6h2v8Zm-4-2h-4v-2h4v2ZM8 10H6V6h2v4Zm6 0h-2V6h2v4Zm-4-4H8V4h2v2Zm8-2h-2v2h-2V4h-4V2h8v2Z";
const ZAP =
  "M4 13h8v6h2v2h-2v2h-2v-8H2v-4h2v2Zm12 6h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2v-2h2v2Zm-6-6h8v4h-2v-2h-8V5h-2V3h2V1h2v8Zm-8 2H4V9h2v2Zm2-2H6V7h2v2Zm2-2H8V5h2v2Z";

type Def = React.ReactNode;

const ICONS: Record<string, Def> = {
  sun: <path d={SUN} />,
  moon: <path d={MOON} />,
  cloud: <path d={CLOUD} />,
  "cloud-sun": <path d={CLOUD_SUN} />,
  "cloud-moon": <path d={CLOUD_MOON} />,
  rain: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" />
      <rect x="5" y="19" width="2" height="4" />
      <rect x="11" y="18" width="2" height="4" />
      <rect x="17" y="19" width="2" height="4" />
    </>
  ),
  drizzle: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" />
      <rect x="5" y="19" width="2" height="2" />
      <rect x="11" y="18" width="2" height="2" />
      <rect x="17" y="19" width="2" height="2" />
    </>
  ),
  snow: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" />
      <rect x="5" y="18" width="2" height="2" />
      <rect x="11" y="18" width="2" height="2" />
      <rect x="17" y="18" width="2" height="2" />
      <rect x="8" y="22" width="2" height="2" />
      <rect x="14" y="22" width="2" height="2" />
    </>
  ),
  fog: (
    <>
      <path d={CLOUD} transform="translate(0 -4)" />
      <rect x="2" y="18" width="14" height="2" />
      <rect x="8" y="22" width="14" height="2" />
    </>
  ),
  thunder: (
    <>
      <path d={CLOUD} transform="translate(0 -5)" />
      <path d={ZAP} transform="translate(9 12) scale(0.5)" />
    </>
  ),
};

export function WeatherIcon({ name, size = 24, className = "" }: { name: string; size?: number; className?: string }) {
  const def = ICONS[name] ?? ICONS.cloud;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" shapeRendering="crispEdges" className={className} aria-hidden>
      {def}
    </svg>
  );
}
