import { currentSpotify, subscribeSpotify } from "@/lib/spotify-live";
import { getNowPlaying, spotifyConnected, type NowPlaying } from "@/lib/spotify";

// Server-sent events: browsers get the current track once on connect and then every change the watcher sees.
// Falls back to nothing on serverless hosts (no long-lived process there); the client polls in that case.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const event = (name: string, data: unknown) => encoder.encode(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);

export async function GET(req: Request) {
  if (!spotifyConnected()) return new Response("spotify is not connected", { status: 404 });
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
      cleanup = () => {
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
