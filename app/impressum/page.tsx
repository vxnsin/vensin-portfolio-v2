import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "impressum", robots: { index: false } };

// The postal address is a c/o address from an impressum service (anschrift.net), not the home address.
// If IMPRESSUM_URL is set, the page forwards there instead (old behaviour, kept as an escape hatch).
const NAME = "Luis Kanzewitsch";
const ADDRESS = ["c/o COCENTER", "Koppoldstr. 1", "86551 Aichach", "Deutschland"];
const EMAIL = "vxnsin@icloud.com";

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="pixel text-ink mt-4 mb-1">{children}</h3>;
}

export default function ImpressumPage() {
  const url = process.env.IMPRESSUM_URL;
  if (url) redirect(url);

  return (
    <div className="text-sm leading-relaxed max-w-prose">
      <h2 className="pixel text-lg text-accent">impressum</h2>

      <H>Angaben gemäß § 5 DDG</H>
      <p>
        {NAME}
        <br />
        {ADDRESS.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </p>

      <H>Kontakt</H>
      <p>
        E-Mail: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        <br />
        oder über das <Link href="/contact">Kontaktformular</Link>
      </p>

      <H>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</H>
      <p>
        {NAME}
        <br />
        Anschrift wie oben
      </p>

      <H>Hinweis zur Anschrift</H>
      <p className="text-xs text-ink-soft">
        Die angegebene Adresse ist eine ladungsfähige c/o-Anschrift eines Impressum-Dienstes. Post an diese Adresse wird entgegengenommen
        und an den Betreiber weitergeleitet.
      </p>

      <H>Haftung für Inhalte und Links</H>
      <p className="text-xs text-ink-soft">
        vensin.dev ist eine private, nicht-kommerzielle Website. Die Inhalte wurden mit Sorgfalt erstellt; für Richtigkeit,
        Vollständigkeit und Aktualität wird keine Gewähr übernommen. Für Inhalte verlinkter externer Seiten ist ausschließlich deren
        Betreiber verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar; bei Bekanntwerden werden
        betroffene Links umgehend entfernt.
      </p>

      <p className="mt-4 text-xs text-ink-soft">
        Siehe auch die <Link href="/privacy">Datenschutzerklärung</Link>.
      </p>
    </div>
  );
}
