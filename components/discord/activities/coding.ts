import type { ActivityHandler } from "./types";
import { largeImage, smallImage, strip } from "./util";

// editors with rich presence (vscord, jetbrains, neovim, …)
const EDITOR = /visual studio code|vs code|vscode|code - insiders|cursor|windsurf|intellij|webstorm|pycharm|jetbrains|neovim|nvim|zed|sublime/i;

/** vscord: details = "workspace | - N problems found", state = "file:line:col", large_text = "TSX" */
export const coding: ActivityHandler = {
  id: "coding",
  match: (a) => a.type === 0 && EDITOR.test(a.name),
  info: (a) => {
    const [workspaceRaw, problemsRaw] = (a.details ?? "").split("|");
    const workspace = strip(workspaceRaw) || null;
    const problems = strip(problemsRaw).replace(/^-\s*/, "") || null;
    const file = strip(a.state) || null;
    const languageRaw = strip(a.assets?.large_text) || null;
    const language = languageRaw && languageRaw !== workspace ? languageRaw : null; // idle state repeats "Idling" everywhere
    const editor = a.name.replace(/^Visual Studio Code$/i, "vs code");
    const idle = /idl(e|ing)/i.test(workspace ?? "") || /zzz/i.test(a.assets?.small_text ?? "");
    return {
      kind: "coding",
      icon: idle ? "💤" : "💻",
      heading: idle ? `idling in ${editor}` : `coding in ${editor}`,
      title: workspace ?? editor,
      sub: file && file !== workspace ? file : null,
      sub2: [language, problems].filter(Boolean).join(" · ") || null,
      image: largeImage(a),
      smallImage: smallImage(a),
      elapsedFrom: a.timestamps?.start ?? null,
      latest: { value: `${workspace ?? editor}${file ? ` · ${file.split(":")[0]}` : ""}` },
    };
  },
};
