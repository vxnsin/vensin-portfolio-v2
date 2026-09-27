// Runs once when the server process starts (not during `next build`).
// The nested check lets the bundler drop the import for the edge build entirely.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.SCHEDULER !== "off") {
      const { startScheduler } = await import("./lib/scheduler");
      startScheduler();
      const { startSpotifyLive } = await import("./lib/spotify-live");
      startSpotifyLive();
    }
  }
}
