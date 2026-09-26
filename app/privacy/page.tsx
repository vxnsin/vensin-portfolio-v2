import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "datenschutz", description: "Datenschutzerklärung für vensin.dev" };

const UPDATED = "26.09.2026";

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="pixel text-ink mt-4 mb-1">{children}</h3>;
}

export default function PrivacyPage() {
  const impressum = process.env.IMPRESSUM_URL;
  return (
    <div className="text-sm leading-relaxed max-w-prose">
      <h2 className="pixel text-lg text-accent">datenschutzerklärung</h2>
      <p className="text-xs text-ink-soft">Stand: {UPDATED}</p>

      <H>1. Verantwortlicher</H>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist der im{" "}
        {impressum ? (
          <a href={impressum} target="_blank" rel="noreferrer">
            Impressum
          </a>
        ) : (
          <Link href="/impressum">Impressum</Link>
        )}{" "}
        genannte Betreiber. Das Impressum wird über einen externen Impressum-Dienst bereitgestellt.
      </p>

      <H>2. Was diese Seite ist</H>
      <p>
        vensin.dev ist eine private, nicht-kommerzielle Portfolio-Website. Es werden keine Nutzerkonten angeboten, es findet keine Werbung
        und kein Tracking statt. Es werden keine Analyse-Dienste (z.&nbsp;B. Google Analytics) eingesetzt.
      </p>

      <H>3. Hosting und Server-Logs</H>
      <p>
        Die Website wird auf eigener Hardware betrieben und über Cloudflare (Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107,
        USA) als Reverse-Proxy ausgeliefert. Beim Aufruf werden technisch notwendige Verbindungsdaten (IP-Adresse, Zeitpunkt, aufgerufene
        URL, User-Agent) durch Cloudflare und den Webserver verarbeitet, um die Seite auszuliefern und Angriffe abzuwehren
        (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO). Server-Logs werden nicht dauerhaft gespeichert und nicht mit anderen Daten
        zusammengeführt. Cloudflare kann Daten in den USA verarbeiten; Grundlage sind die EU-Standardvertragsklauseln und das
        EU-US Data Privacy Framework.
      </p>

      <H>4. Cookies und lokale Speicherung</H>
      <p>
        Für Besucher werden keine Cookies gesetzt. Die Wahl zwischen hellem und dunklem Design wird ausschließlich im lokalen Speicher
        deines Browsers (localStorage) abgelegt und nicht an den Server übertragen. Ein Cookie wird nur für den passwortgeschützten
        Administrationsbereich des Betreibers gesetzt; Besucher sind davon nicht betroffen.
      </p>

      <H>5. Kontaktformular</H>
      <p>
        Wenn du das Kontaktformular nutzt, werden Name, E-Mail-Adresse, Nachricht und Zeitpunkt auf dem Server gespeichert, damit die
        Anfrage beantwortet werden kann (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO). Zusätzlich wird der Betreiber über neue Nachrichten
        per Discord benachrichtigt; dabei werden Name, E-Mail-Adresse und Nachricht an Discord Inc. (444 De Haro Street, San Francisco,
        CA 94107, USA) übermittelt. Zum Schutz vor Spam wird die IP-Adresse kurzzeitig im Arbeitsspeicher gehalten, aber nicht
        gespeichert. Nachrichten werden nach Bearbeitung gelöscht und nicht an weitere Dritte weitergegeben.
      </p>

      <H>6. Inhalte von Drittanbietern</H>
      <p>
        Einige Elemente der Seite lädt dein Browser direkt bei Drittanbietern. Dabei erhält der jeweilige Anbieter deine IP-Adresse und
        übliche Browserdaten. Grundlage ist das berechtigte Interesse an der Darstellung der Inhalte (Art.&nbsp;6 Abs.&nbsp;1
        lit.&nbsp;f DSGVO).
      </p>
      <ul className="list-disc pl-5 grid gap-1 text-xs">
        <li>
          <b>Lanyard</b> (api.lanyard.rest): liefert den Discord-Status des Betreibers per WebSocket. Betreiber: Phineas (Open-Source-Projekt).
        </li>
        <li>
          <b>Discord CDN</b> (cdn.discordapp.com, media.discordapp.net): Profilbild, Emojis und Aktivitätsbilder für das Discord-Widget.
          Discord Inc., USA.
        </li>
        <li>
          <b>Spotify</b> (i.scdn.co): Albumcover, wenn gerade Musik läuft. Spotify AB, Regeringsgatan 19, 111 53 Stockholm, Schweden.
        </li>
        <li>
          <b>Kitsu</b> (media.kitsu.app): Anime-Poster auf der Anime-Seite und im Discord-Widget. Kitsu / Hummingbird Media, USA.
        </li>
        <li>
          <b>YouTube-Vorschaubilder</b> und andere Aktivitätsbilder werden über das Discord CDN geladen, nicht direkt bei YouTube.
        </li>
      </ul>
      <p className="mt-2">
        Schriftarten werden lokal von dieser Seite ausgeliefert, es findet keine Verbindung zu Google Fonts statt. Wetter- und
        GitHub-Daten werden ausschließlich serverseitig abgerufen; dein Browser stellt dazu keine Verbindung zu Open-Meteo oder GitHub her.
      </p>

      <H>7. Fotos und Videos</H>
      <p>
        Die Galerie zeigt eigene Aufnahmen des Betreibers. Sie werden von dieser Seite selbst ausgeliefert. Personen sind, sofern
        abgebildet, einverstanden.
      </p>

      <H>8. Externe Links</H>
      <p>
        Diese Website enthält Links zu externen Angeboten (u.&nbsp;a. GitHub, TikTok, Steam, Discord, Kitsu, Spotify). Auf deren Inhalte
        und Datenverarbeitung hat der Betreiber keinen Einfluss; es gelten die Datenschutzhinweise des jeweiligen Anbieters. Zum Zeitpunkt
        der Verlinkung waren keine Rechtsverstöße erkennbar; bei Bekanntwerden werden betroffene Links entfernt.
      </p>

      <H>9. Deine Rechte</H>
      <p>
        Du hast das Recht auf Auskunft (Art.&nbsp;15 DSGVO), Berichtigung (Art.&nbsp;16), Löschung (Art.&nbsp;17), Einschränkung der
        Verarbeitung (Art.&nbsp;18), Datenübertragbarkeit (Art.&nbsp;20) und Widerspruch (Art.&nbsp;21). Außerdem kannst du dich bei einer
        Datenschutz-Aufsichtsbehörde beschweren. Anfragen dazu bitte über das{" "}
        <Link href="/contact">Kontaktformular</Link> oder die im Impressum genannten Kontaktdaten.
      </p>

      <H>10. Änderungen</H>
      <p>Diese Erklärung wird angepasst, wenn sich die Website oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.</p>
    </div>
  );
}
