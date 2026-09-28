import type { Metadata } from "next";
import Link from "next/link";
import { BLOCKED_RETENTION_DAYS } from "@/lib/discord-notify";

export const metadata: Metadata = { title: "datenschutz", description: "Datenschutzerklärung für vensin.dev" };

const UPDATED = "28.09.2026";

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="pixel text-ink mt-4 mb-1">{children}</h3>;
}

export default function PrivacyPage() {
  const impressum = process.env.IMPRESSUM_URL;
  const impressumLink = impressum ? (
    <a href={impressum} target="_blank" rel="noreferrer">
      Impressum
    </a>
  ) : (
    <Link href="/impressum">Impressum</Link>
  );
  return (
    <div className="text-sm leading-relaxed max-w-prose">
      <h2 className="pixel text-lg text-accent">datenschutzerklärung</h2>
      <p className="text-xs text-ink-soft">Stand: {UPDATED}</p>

      <H>1. Verantwortlicher</H>
      <p>
        Verantwortlich für die Datenverarbeitung auf dieser Website ist Luis Kanzewitsch (online: vensin), Betreiber von vensin.dev. Die
        ladungsfähige Anschrift ist aus Gründen des persönlichen Schutzes eine c/o-Anschrift eines Impressum-Dienstes und im{" "}
        {impressumLink} angegeben. Du erreichst den Verantwortlichen direkt über das <Link href="/contact">Kontaktformular</Link> oder
        die im Impressum genannte E-Mail-Adresse.
      </p>

      <H>2. Was diese Seite ist</H>
      <p>
        vensin.dev ist eine private, nicht-kommerzielle Portfolio-Website. Es werden keine Nutzerkonten angeboten, es findet keine Werbung
        und kein Tracking statt. Es werden keine Analyse-Dienste (z.&nbsp;B. Google Analytics) eingesetzt. Der Besucherzähler im
        Fußbereich zählt pro Tag höchstens einen Aufruf pro Person: dazu wird aus IP-Adresse, Browserkennung und Tagesdatum ein
        gekürzter Hash gebildet, der nach zwei Tagen gelöscht wird; er lässt sich weder zurückrechnen noch über Tage hinweg verknüpfen
        (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO). Gespeichert bleibt nur die Gesamtzahl.
      </p>

      <H>3. Hosting und Server-Logs</H>
      <p>
        Die Website wird auf eigener Hardware in Deutschland betrieben und direkt von dort ausgeliefert; es ist kein externer
        Hosting-Anbieter oder CDN zwischengeschaltet. Beim Aufruf werden technisch notwendige Verbindungsdaten (IP-Adresse, Zeitpunkt,
        aufgerufene URL, User-Agent) durch den Webserver verarbeitet, um die Seite auszuliefern und Angriffe abzuwehren
        (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO). Server-Logs werden nicht dauerhaft gespeichert und nicht mit anderen Daten
        zusammengeführt. Das TLS-Zertifikat wird bei Let&apos;s Encrypt (Internet Security Research Group, USA) bezogen; dabei werden keine
        Besucherdaten übermittelt.
      </p>

      <H>4. Cookies und lokale Speicherung</H>
      <p>
        Es werden keine Tracking-Cookies gesetzt. Beim ersten Besuch fragt ein kleines Fenster am unteren Rand, ob die Seite sich dein
        Aussehen und die Katze merken darf. Sagst du ja, merkt sich ein Cookie (&quot;theme&quot;, ein Jahr gültig) deine Wahl zwischen Tag-
        und Nachtdesign, es enthält nur das Wort &quot;light&quot; oder &quot;dark&quot;. Genauso merkt sich ein Cookie &quot;season&quot; (ein Jahr
        gültig) eine selbst gewählte Jahreszeit; ohne Auswahl wird es nicht gesetzt. Wählst du &quot;nur was nötig ist&quot;, funktionieren die
        Schalter trotzdem, die Seite vergisst sie aber beim Verlassen und speichert nichts davon. Deine Antwort selbst wird in einem Cookie
        &quot;consent&quot; (ein Jahr gültig) festgehalten, damit die Frage nicht bei jedem Besuch erscheint; du kannst sie jederzeit über den
        Knopf &quot;cookies&quot; im Fußbereich ändern. Ein weiteres Cookie wird nur für den passwortgeschützten Administrationsbereich des
        Betreibers gesetzt; Besucher sind davon nicht betroffen. Rechtsgrundlage ist deine Einwilligung (Art.&nbsp;6 Abs.&nbsp;1
        lit.&nbsp;a DSGVO, §&nbsp;25 Abs.&nbsp;1 TDDDG) beziehungsweise für das Merken der Antwort die technische Erforderlichkeit
        (§&nbsp;25 Abs.&nbsp;2 TDDDG).
      </p>
      <p>
        Das kleine Klick-Spiel auf der Seite &quot;mochi&quot; speichert seinen Spielstand ausschließlich im lokalen Speicher deines Browsers
        (localStorage); ebenso merkt sich der Browser dort, ob du die Katze per Tastatur-Code verwandelt hast. Beides passiert nur, wenn du
        im Cookie-Fenster zugestimmt hast; andernfalls läuft das Spiel nur für den aktuellen Besuch. Diese Daten verlassen deinen Browser
        nicht und lassen sich jederzeit über die Browser-Einstellungen löschen. An den Server geht aus dem Spiel nur eine anonyme
        Anzahl von Klicks, die zu einem Gesamtzähler addiert wird; sie wird keiner Person und keiner IP-Adresse zugeordnet.
      </p>

      <H>5. Kontaktformular</H>
      <p>
        Wenn du das Kontaktformular nutzt, werden dein Name, deine E-Mail-Adresse, deine Nachricht und der Zeitpunkt auf dem Server
        gespeichert, damit die Anfrage beantwortet werden kann (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO). Zum Schutz vor Spam wird ein
        gekürzter, nicht rückrechenbarer Hash der IP-Adresse zusammen mit der Nachricht gespeichert (höchstens zwei Nachrichten pro Tag
        und Absender); die IP-Adresse im Klartext wird nicht gespeichert.
      </p>
      <p className="mt-2">
        Um eingehende Nachrichten zeitnah zu bemerken und bearbeiten zu können, nutzt der Betreiber eine Benachrichtigung über Discord.
        Dabei werden Name, E-Mail-Adresse und Nachricht an Discord Inc. (444 De Haro Street, San Francisco, CA 94107, USA) übermittelt.
        Grundlage ist das berechtigte Interesse des Betreibers an einer effizienten Bearbeitung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO).
        Discord Inc. ist unter dem EU-US Data Privacy Framework zertifiziert. Nachrichten werden nach der Bearbeitung gelöscht und nicht
        an weitere Dritte weitergegeben.
      </p>

      <H>5a. Gästebuch</H>
      <p>
        Einträge im Gästebuch (Name, Nachricht, optional eine Website und der Zeitpunkt) werden auf dem Server gespeichert und öffentlich
        auf dieser Seite angezeigt (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO). Du erteilst deine Einwilligung freiwillig durch das
        Absenden des Eintrags. Du kannst diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, zum Beispiel über das{" "}
        <Link href="/contact">Kontaktformular</Link>; dein Eintrag wird dann umgehend gelöscht. Einträge, die von einem automatischen
        Filter markiert werden (etwa wegen enthaltener Links), erscheinen erst nach Freigabe durch den Betreiber.
      </p>
      <p className="mt-2">
        <b>Benachrichtigung:</b> Zur Administration wird der Betreiber über neue Einträge über Discord benachrichtigt; dabei werden Name,
        Nachricht und Website an Discord Inc. übermittelt (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO; Drittlandtransfer abgesichert über
        das EU-US Data Privacy Framework).
      </p>
      <p className="mt-2">
        <b>Spam- und Missbrauchsschutz:</b> Im Normalfall wird die IP-Adresse sofort in einen gekürzten, nicht rückrechenbaren Hash
        umgewandelt und nur dieser Hash zusammen mit dem Eintrag gespeichert; die IP-Adresse im Klartext wird nicht gespeichert. Wird ein
        Eintrag vom automatischen Filter als Missbrauch eingestuft und abgelehnt (etwa Beleidigungen oder automatisierte Bot-Eingaben),
        verarbeitet der Betreiber abweichend davon die IP-Adresse und die Browserkennung des Absenders im Klartext, um wiederholte
        Angriffe zu erkennen und die Sicherheit des Systems zu gewährleisten (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO). Der abgelehnte
        Eintrag selbst wird nicht gespeichert und nicht angezeigt. Diese Missbrauchsdaten werden nach {BLOCKED_RETENTION_DAYS} Tagen
        automatisch gelöscht.
      </p>

      <H>6. Inhalte von Drittanbietern</H>
      <p>
        Einige Elemente der Seite lädt dein Browser direkt bei Drittanbietern. Dabei erhält der jeweilige Anbieter deine IP-Adresse und
        übliche Browserdaten. Grundlage ist das berechtigte Interesse an der funktionalen und ansprechenden Darstellung der Inhalte
        (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO).
      </p>
      <ul className="list-disc pl-5 grid gap-1 text-xs">
        <li>
          <b>Lanyard</b> (api.lanyard.rest): liefert den Discord-Status des Betreibers per WebSocket. Betreiber: Phineas (Open-Source-Projekt).
        </li>
        <li>
          <b>Discord CDN</b> (cdn.discordapp.com, media.discordapp.net): Profilbild, Emojis und Aktivitätsbilder für das Discord-Widget.
          Discord Inc., USA (abgesichert über das EU-US Data Privacy Framework).
        </li>
        <li>
          <b>Spotify</b> (i.scdn.co): Albumcover, Artist-Bilder und Playlist-Cover auf der Musik-Seite und im Discord-Widget. Spotify AB, Regeringsgatan 19,
          111 53 Stockholm, Schweden. Die Hördaten auf der Musik-Seite betreffen ausschließlich den Betreiber selbst und werden serverseitig abgerufen.
        </li>
        <li>
          <b>Kitsu</b> (media.kitsu.app): Anime-Poster auf der Anime-Seite und im Discord-Widget. Kitsu / Hummingbird Media, USA.
        </li>
        <li>
          <b>YouTube-Vorschaubilder</b> und andere Aktivitätsbilder werden über das Discord CDN geladen, nicht direkt bei YouTube.
        </li>
      </ul>
      <p className="mt-2">
        Schriftarten werden lokal von dieser Seite ausgeliefert, es findet keine Verbindung zu Google Fonts statt. Wetter-,
        GitHub- und Liedtext-Daten (LRCLIB) werden ausschließlich serverseitig abgerufen; dein Browser stellt dazu keine Verbindung zu
        Open-Meteo, GitHub oder LRCLIB her.
      </p>

      <H>7. Fotos und Videos</H>
      <p>
        Die Galerie zeigt eigene Aufnahmen des Betreibers. Sie werden von dieser Seite selbst ausgeliefert. Personen sind, sofern
        abgebildet, einverstanden.
      </p>

      <H>8. Externe Links</H>
      <p>
        Diese Website enthält Links zu externen Angeboten (u.&nbsp;a. GitHub, TikTok, Instagram, Snapchat, Steam, Discord, Kitsu, Spotify). Auf deren Inhalte
        und Datenverarbeitung hat der Betreiber keinen Einfluss; es gelten die Datenschutzhinweise des jeweiligen Anbieters. Zum Zeitpunkt
        der Verlinkung waren keine Rechtsverstöße erkennbar; bei Bekanntwerden werden betroffene Links entfernt.
      </p>

      <H>9. Deine Rechte</H>
      <p>
        Du hast das Recht auf Auskunft (Art.&nbsp;15 DSGVO), Berichtigung (Art.&nbsp;16), Löschung (Art.&nbsp;17), Einschränkung der
        Verarbeitung (Art.&nbsp;18), Datenübertragbarkeit (Art.&nbsp;20) und Widerspruch (Art.&nbsp;21). Eine erteilte Einwilligung kannst
        du jederzeit mit Wirkung für die Zukunft widerrufen. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren.
        Anfragen dazu bitte über das <Link href="/contact">Kontaktformular</Link> oder die im Impressum genannten Kontaktdaten.
      </p>

      <H>10. Änderungen</H>
      <p>Diese Erklärung wird angepasst, wenn sich die Website oder die Rechtslage ändert. Es gilt die jeweils hier veröffentlichte Fassung.</p>
    </div>
  );
}
