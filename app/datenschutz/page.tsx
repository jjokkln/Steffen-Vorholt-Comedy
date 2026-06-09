import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Steffen Vorholt",
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

        <h2 id="cookies">4. Cookies & Cookie-Richtlinie</h2>
        <p>
          Diese Website setzt aktuell <strong>keine</strong> Tracking- oder Marketing-Cookies und
          bindet keine Analyse-Tools (z. B. Google Analytics) ein. Es werden ausschließlich technisch
          notwendige Daten zur Auslieferung der Seite verarbeitet.
        </p>
        <p>
          <span className="ph">
            Sobald Cookies, ein Cookie-Banner, Analyse- oder Marketing-Tools eingesetzt werden, ist
            dieser Abschnitt um Zweck, Anbieter, Speicherdauer und Einwilligung (Art. 6 Abs. 1 lit. a
            DSGVO / § 25 TDDDG) zu ergänzen.
          </span>
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
          <span className="ph">
            Hinweis: Sobald die Formulare technisch über einen Dienstleister (z. B. Supabase)
            verarbeitet werden, ist dieser als Auftragsverarbeiter hier zu ergänzen.
          </span>
        </p>

        <h2>6. Externe Ticketdienste</h2>
        <p>
          Ticketlinks auf dieser Website führen zu externen Anbietern (u. a. Eventbrite,
          Rausgegangen). Sobald Sie einem solchen Link folgen, gelten die Datenschutzbestimmungen des
          jeweiligen Anbieters. Auf die dortige Datenverarbeitung haben wir keinen Einfluss.
        </p>

        <h2>7. Externe Medien & Social Media</h2>
        <p>
          <span className="ph">
            Sofern künftig Inhalte von Drittplattformen (z. B. Instagram, TikTok, YouTube) eingebettet
            werden, ist hier der jeweilige Anbieter samt Datenübermittlung und Rechtsgrundlage zu
            ergänzen. Aktuell werden keine externen Medien eingebettet.
          </span>
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
