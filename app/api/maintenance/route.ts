import { site } from "@/data/site";
import { getMaintenance } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Standalone maintenance page (no sidebar, no widgets). The proxy rewrites every public route here while maintenance is on.
export async function GET() {
  const m = getMaintenance();
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(site.domain)} — brb</title>
<style>
  :root { --bg: #17121c; --paper: #1f1826; --paper2: #291f32; --ink: #f1e7f0; --soft: #b39fb0; --line: #5c4a62; --accent: #ff8fb4; --accent2: #b0a4ff; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    background: var(--bg);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cg fill='none' stroke='%23fff' stroke-opacity='0.06' stroke-width='1.2'%3E%3Cpath d='M0 20a20 20 0 0 1 40 0'/%3E%3Cpath d='M5 20a15 15 0 0 1 30 0'/%3E%3Cpath d='M10 20a10 10 0 0 1 20 0'/%3E%3Cpath d='M-20 20a20 20 0 0 1 40 0'/%3E%3Cpath d='M20 20a20 20 0 0 1 40 0'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 40px 20px;
    color: var(--ink);
    font: 14px/1.6 ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, monospace;
    display: grid; place-items: center; padding: 16px;
  }
  .win { width: 100%; max-width: 460px; background: var(--paper); border: 1.5px dashed var(--line); box-shadow: 4px 4px 0 var(--line); }
  .title { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1.5px solid var(--line); background: var(--paper2); font-size: 13px; }
  .dots { display: inline-flex; gap: 4px; }
  .dots i { width: 8px; height: 8px; border-radius: 50%; border: 1px solid var(--line); background: var(--paper); }
  .dots i:first-child { background: var(--accent); }
  .body { padding: 18px 16px; text-align: center; }
  h1 { margin: 0 0 4px; font-size: 22px; font-weight: 600; letter-spacing: 0.02em; }
  .jp { color: var(--soft); font-size: 12px; margin-bottom: 14px; }
  p { margin: 8px 0; color: var(--soft); }
  .kao { font-size: 20px; margin: 10px 0 4px; color: var(--accent2); }
  .blink { animation: blink 1.2s steps(2) infinite; }
  @keyframes blink { to { visibility: hidden; } }
  a { color: var(--accent2); text-decoration: underline dotted; text-underline-offset: 3px; }
  a:hover { color: var(--accent); }
  .foot { border-top: 1.5px dashed var(--line); padding: 8px 10px; font-size: 12px; color: var(--soft); display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="win">
    <div class="title"><span class="dots"><i></i><i></i><i></i></span> ${esc(site.domain)} — brb</div>
    <div class="body">
      <h1>under maintenance</h1>
      <div class="jp">ただいまメンテナンス中です</div>
      <p>${esc(m.message)}<span class="blink">_</span></p>
      <div class="kao">_(:з)∠)_</div>
      <p><a href="https://github.com/${esc(site.githubUser)}" rel="noopener">github</a> · <a href="https://discord.gg/velane" rel="noopener">discord</a></p>
    </div>
    <div class="foot"><span>${m.since ? `since ${esc(m.since.slice(0, 16).replace("T", " "))} utc` : ""}</span><span>${esc(site.name)}</span></div>
  </div>
</body>
</html>`;
  return new Response(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "retry-after": "3600" } });
}
