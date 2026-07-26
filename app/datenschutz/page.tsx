import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Datenschutzerklärung gemäß DSGVO für die Website von Steffen Vorholt.",
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <>
      <section className="container section legal">
        <div className="eyebrow">🔒 Datenschutz</div>
        <h1>Datenschutzerklärung</h1>

        <div className="notice">
          <strong>Platzhalter — vor Go-Live prüfen.</strong> Die gelb markierten Felder müssen
          ausgefüllt und die genutzten Dienste an den realen Stand angepasst werden (z. B. sobald
          Formulare über Supabase laufen oder Social-Media-Embeds eingebunden sind). Diese Vorlage
          ersetzt keine Rechtsberatung.
        </div>

        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:
          <br />
          <span className="ph">[Vor- und Nachname]</span>
          <br />
          <span className="ph">[Straße und Hausnummer]</span>
          <br />
          <span className="ph">[PLZ und Ort]</span>
          <br />
          E-Mail: <span className="ph">[E-Mail-Adresse]</span>
        </p>

        <h2>2. Hosting (Vercel)</h2>
        <p>
          Diese Website wird bei der Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA,
          gehostet. Beim Aufruf der Website verarbeitet Vercel als Auftragsverarbeiter technisch
          notwendige Daten (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs, abgerufene Seite,
          User-Agent), um die Auslieferung der Seite zu ermöglichen. Rechtsgrundlage ist unser
          berechtigtes Interesse an einer sicheren und effizienten Bereitstellung des Angebots
          (Art. 6 Abs. 1 lit. f DSGVO).
        </p>
        <p>
          Es kann zu einer Übermittlung von Daten in die USA kommen. Mit Vercel besteht ein
          Auftragsverarbeitungsvertrag (Data Processing Addendum); die Übermittlung wird auf die
          Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework gestützt.
        </p>

        <h2>3. Server-Logfiles</h2>
        <p>
          Der Hosting-Anbieter erhebt und speichert automatisch Informationen in sogenannten
          Server-Logfiles, die Ihr Browser automatisch übermittelt. Dies sind insbesondere
          Browsertyp und -version, verwendetes Betriebssystem, Referrer-URL, Hostname des
          zugreifenden Rechners, Uhrzeit der Serveranfrage und die IP-Adresse. Eine Zusammenführung
          dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung erfolgt auf
          Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
        </p>

        <h2 id="cookies">4. Cookies, Einwilligung & Cookie-Richtlinie</h2>
        <p>
          Diese Website setzt <strong>keine</strong> Tracking- oder Marketing-Cookies und bindet
          <strong> keine</strong> Analyse-Tools (z. B. Google Analytics, Vercel Analytics) ein. Es
          findet keine Reichweitenmessung und keine Profilbildung statt.
        </p>
        <p>
          Verwendete Schriftarten (Inter, Space Grotesk) werden beim Erstellen der Website
          heruntergeladen und von unserem eigenen Server ausgeliefert. Beim Aufruf der Seite gehen
          dadurch <strong>keine</strong> Anfragen an Google-Server.
        </p>
        <p>
          Im lokalen Speicher Ihres Browsers (localStorage) legen wir lediglich Ihre
          Datenschutz-Entscheidung unter dem Schlüssel <em>sv_consent</em> ab, damit Sie nicht bei
          jedem Besuch erneut gefragt werden. Gespeichert werden der Zeitpunkt und die von Ihnen
          gewählten Kategorien; die Angabe wird nach 180 Tagen automatisch ungültig. Diese
          Speicherung ist für den von Ihnen gewünschten Dienst unbedingt erforderlich und daher nach
          § 25 Abs. 2 Nr. 2 TDDDG einwilligungsfrei. Es werden keine Daten an uns oder Dritte
          übertragen.
        </p>
        <p>
          Einwilligungspflichtig ist auf dieser Website ausschließlich das Laden externer Medien
          (siehe Ziffer 7). Rechtsgrundlage hierfür ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a
          DSGVO in Verbindung mit § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit mit
          Wirkung für die Zukunft widerrufen — über den Link „Datenschutz-Einstellungen“ im Fußbereich
          jeder Seite. Durch den Widerruf wird die Rechtmäßigkeit der bis dahin erfolgten
          Verarbeitung nicht berührt.
        </p>
        <p>
          Im Administrationsbereich dieser Website (<em>/admin</em>) wird nach dem Login ein
          technisch notwendiges Sitzungs-Cookie gesetzt. Es dient ausschließlich der Authentifizierung
          der Betreiberin bzw. des Betreibers und ist für Besucherinnen und Besucher der Website ohne
          Bedeutung.
        </p>

        <h2>5. Kontaktaufnahme & Anfrageformulare</h2>
        <p>
          Wenn Sie uns über ein Formular (z. B. Booking-Anfrage oder Comedian-Bewerbung) oder per
          E-Mail kontaktieren, werden die von Ihnen angegebenen Daten (z. B. Name, E-Mail-Adresse,
          Telefonnummer, Nachrichteninhalt) zur Bearbeitung Ihrer Anfrage gespeichert. Rechtsgrundlage
          ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen / Vertragsanbahnung) bzw. Art. 6
          Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung). Die Daten werden gelöscht,
          sobald sie für die Zweckerreichung nicht mehr erforderlich sind und keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen.
        </p>
        <p>
          Die über die Formulare übermittelten Angaben werden in einer Datenbank der Supabase Inc.
          gespeichert, die als Auftragsverarbeiter für uns tätig ist. Das genutzte Projekt wird
          ausschließlich in der Region <strong>EU (Frankfurt am Main, Deutschland)</strong> betrieben;
          eine Speicherung außerhalb der Europäischen Union findet nicht statt. Es besteht ein
          Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.
        </p>
        <p>
          Zusätzlich werden Sie und wir per E-Mail über den Eingang Ihrer Anfrage informiert. Der
          Versand erfolgt über den E-Mail-Server unseres Anbieters; dabei werden die von Ihnen
          angegebenen Daten übermittelt.
        </p>

        <h2>5a. Bilder, Videos & Inhalte (Supabase Storage)</h2>
        <p>
          Bilder und Mediendateien dieser Website werden über den Speicherdienst von Supabase
          ausgeliefert (Region EU/Frankfurt). Beim Laden einer Seite wird dabei Ihre IP-Adresse
          technisch bedingt an diesen Dienst übermittelt, um die Inhalte darstellen zu können.
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Auslieferung
          der Website). Die Daten verbleiben innerhalb der EU.
        </p>

        <h2>6. Externe Ticketdienste</h2>
        <p>
          Ticketlinks auf dieser Website führen zu externen Anbietern (u. a. Eventbrite,
          Rausgegangen). Sobald Sie einem solchen Link folgen, gelten die Datenschutzbestimmungen des
          jeweiligen Anbieters. Auf die dortige Datenverarbeitung haben wir keinen Einfluss.
        </p>

        <h2>7. Externe Medien (YouTube) — nur mit Ihrer Einwilligung</h2>
        <p>
          Auf einzelnen Seiten binden wir Videos der Plattform YouTube ein. Anbieter ist die Google
          Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland; Daten können dabei auch an
          die Google LLC in den USA übermittelt werden. Grundlage der Übermittlung sind die
          Standardvertragsklauseln der EU-Kommission bzw. das EU-US Data Privacy Framework.
        </p>
        <p>
          Wir verwenden den erweiterten Datenschutzmodus (<em>youtube-nocookie.com</em>). Darüber
          hinaus werden die Videos <strong>nicht automatisch geladen</strong>: Solange Sie nicht
          eingewilligt haben, sehen Sie an ihrer Stelle lediglich einen Platzhalter, der auf unserem
          eigenen Server liegt. Es wird in diesem Zustand keinerlei Verbindung zu Google aufgebaut —
          auch keine Vorschaubilder.
        </p>
        <p>
          Erst wenn Sie ein Video aktiv laden oder YouTube im Einwilligungs-Dialog dauerhaft
          erlauben, wird die Verbindung hergestellt. Dabei werden insbesondere Ihre IP-Adresse,
          Informationen über Ihren Browser und Ihr Endgerät sowie die aufgerufene Seite an Google
          übertragen und Informationen auf Ihrem Endgerät gespeichert bzw. ausgelesen. Sind Sie
          gleichzeitig bei Google eingeloggt, kann Google den Aufruf Ihrem Konto zuordnen.
          Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1
          TDDDG. Sie können sie jederzeit über „Datenschutz-Einstellungen“ im Fußbereich widerrufen.
        </p>
        <p>
          Weitere Informationen zum Umgang mit Nutzerdaten finden Sie in der Datenschutzerklärung von
          Google unter{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline" }}
          >
            policies.google.com/privacy
          </a>
          .
        </p>
        <p>
          Inhalte von Instagram, TikTok oder anderen sozialen Netzwerken werden <strong>nicht</strong>{" "}
          eingebettet. Verweise auf unsere Profile dort sind reine Links — erst durch Anklicken
          verlassen Sie diese Website.
        </p>

        <h2>8. Ihre Rechte</h2>
        <p>
          Sie haben gegenüber dem Verantwortlichen folgende Rechte hinsichtlich Ihrer
          personenbezogenen Daten:
        </p>
        <ul>
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruchsrecht gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Recht auf Widerruf einer erteilten Einwilligung (Art. 7 Abs. 3 DSGVO)</li>
        </ul>

        <h2>9. Beschwerderecht bei der Aufsichtsbehörde</h2>
        <p>
          Ihnen steht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu. Zuständig ist in
          der Regel die Aufsichtsbehörde Ihres üblichen Aufenthaltsortes, Ihres Arbeitsplatzes oder
          des Orts des mutmaßlichen Verstoßes.
        </p>

        <h2>10. SSL- bzw. TLS-Verschlüsselung</h2>
        <p>
          Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
          Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an
          „https://“ in der Adresszeile Ihres Browsers.
        </p>

        <p style={{ marginTop: "2.5em", fontSize: ".85rem" }}>
          Stand: <span className="ph">[Datum eintragen]</span>
        </p>
      </section>

      <Footer />
    </>
  );
}
