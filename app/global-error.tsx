"use client";

// The root layout itself failed, so there is no shell, no fonts, no css from the app: a self-contained page in the site's colours.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#17121c", color: "#f1e7f0", fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 14, padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 460, background: "#1f1826", border: "1.5px dashed #5c4a62", boxShadow: "4px 4px 0 #5c4a62" }}>
          <div style={{ padding: "6px 10px", borderBottom: "1.5px solid #5c4a62", background: "#291f32", fontSize: 13 }}>vensin.dev — oops</div>
          <div style={{ padding: "18px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 32, color: "#f23f43", marginBottom: 6 }}>500</div>
            <p style={{ color: "#b39fb0", margin: "8px 0" }}>the whole page fell over, not just a part of it. a reload usually fixes it.</p>
            {error.digest && <p style={{ color: "#b39fb0", fontSize: 12 }}>error id {error.digest}</p>}
            <div style={{ fontSize: 20, color: "#b0a4ff", margin: "10px 0" }}>_(:з)∠)_</div>
            <button type="button" onClick={reset} style={{ background: "#291f32", border: "1px solid #5c4a62", color: "#f1e7f0", padding: "5px 12px", font: "inherit", cursor: "pointer", boxShadow: "2px 2px 0 #5c4a62" }}>
              try again
            </button>{" "}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no app router here, the root layout is what failed */}
            <a href="/" style={{ color: "#b0a4ff", marginLeft: 8 }}>
              home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
