import type { Metadata } from "next";

export const metadata: Metadata = { title: "impressum", robots: { index: false } };

// Pflichtangaben nach § 5 DDG. Platzhalter in eckigen Klammern vor dem Livegang ersetzen.
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
          über Lanyard, Cover-Bilder über Kitsu, Wetterdaten über Open-Meteo) werden von den jeweiligen Anbietern geladen; es
          gelten deren Datenschutzbestimmungen. Es werden keine Cookies zu Tracking-Zwecken gesetzt.
        </p>
        <p className="mt-2">
          Kontaktformular: Name, E-Mail-Adresse und Nachricht werden gespeichert, um die Anfrage beantworten zu können, und
          per Discord-Benachrichtigung an den Betreiber weitergeleitet. Die Daten werden nach Bearbeitung gelöscht und nicht
          an Dritte weitergegeben.
        </p>
      </section>
    </div>
  );
}
