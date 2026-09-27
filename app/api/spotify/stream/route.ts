import { currentSpotify, subscribeSpotify } from "@/lib/spotify-live";
import { getNowPlaying, spotifyConnected, type NowPlaying } from "@/lib/spotify";
import { clientIp } from "@/lib/ratelimit";

// open streams are cheap but not free: cap them so a script cannot hold thousands open
const MAX_STREAMS = 200;
const MAX_PER_IP = 4;
let open = 0;
const perIp = new Map<string, number>();

// Server-sent events: browsers get the current track once on connect and then every change the watcher sees.
// Falls back to nothing on serverless hosts (no long-lived process there); the client polls in that case.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const event = (name: string, data: unknown) => encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);

export async function GET(req: Request) {
  if (!spotifyConnected()) return new Response("spotify is not connected", { status: 404 });
  const ip = clientIp(req.headers);
  if (open >= MAX_STREAMS || (perIp.get(ip) ?? 0) >= MAX_PER_IP) return new Response("too many open streams", { status: 429, headers: { "retry-after": "30" } });
  open++;
  perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
  const release = () => {
    open = Math.max(0, open - 1);
    const n = (perIp.get(ip) ?? 1) - 1;
    if (n <= 0) perIp.delete(ip);
    else perIp.set(ip, n);
  };
  const initial: NowPlaying | null = currentSpotify() ?? (await getNowPlaying());

  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (name: string, data: unknown) => {
        try {
          controller.enqueue(event(name, data));
        } catch {}
      };
      send("now", initial ?? { playing: false, track: null, progressMs: 0, fetchedAt: new Date().toISOString(), device: null });
      const unsubscribe = subscribeSpotify((now) => send("now", now));
      const heartbeat = setInterval(() => send("ping", Date.now()), 25_000);
      let released = false;
      cleanup = () => {
        if (!released) {
          released = true;
          release();
        }
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-store, no-transform", connection: "keep-alive", "x-accel-buffering": "no" },
  });
}
