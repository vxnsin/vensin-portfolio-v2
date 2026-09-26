import type { Metadata } from "next";

export const metadata: Metadata = { title: "impressum", robots: { index: false } };

// TODO(Luis): Fill in your real details before going live. Required by § 5 DDG for German websites.
export default function ImpressumPage() {
  return (
    <div className="grid gap-4 text-sm">
      <h2 className="pixel text-lg text-accent">impressum</h2>

      <section>
        <h3 className="pixel mb-1">Angaben gemäß § 5 DDG</h3>
        <p>
          [Vorname Nachname]
          <br />
          [Straße Hausnummer]
          <br />
          [PLZ Ort]
          <br />
          Deutschland
        </p>
      </section>

      <section>
        <h3 className="pixel mb-1">Kontakt</h3>
        <p>E-Mail: [deine@email.de]</p>
      </section>

      <section>
        <h3 className="pixel mb-1">Verantwortlich für den Inhalt</h3>
        <p>[Vorname Nachname], Anschrift wie oben.</p>
      </section>

      <section className="text-xs text-ink-soft">
        <h3 className="pixel mb-1 text-ink">Hinweis</h3>
        <p>
          Diese Website ist ein privates, nicht-kommerzielles Portfolio. Eingebundene Inhalte Dritter (z.&nbsp;B. Discord-Status
          über Lanyard, Cover-Bilder über MyAnimeList/Jikan) werden von den jeweiligen Anbietern geladen; es gelten deren
          Datenschutzbestimmungen.
        </p>
      </section>
    </div>
  );
}
