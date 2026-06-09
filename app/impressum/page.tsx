import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Impressum – Steffen Vorholt",
  description: "Impressum und Anbieterkennzeichnung von Steffen Vorholt.",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <>
      <section className="container section legal">
        <div className="eyebrow">⚖️ Rechtliches</div>
        <h1>Impressum</h1>

        <div className="notice">
          <strong>Platzhalter — vor Go-Live ausfüllen.</strong> Alle gelb markierten Felder müssen
          durch die echten Anbieterdaten ersetzt werden. Diese Vorlage ersetzt keine Rechtsberatung.
          Pflichtangaben nach § 5 DDG (ehem. TMG) und § 18 Abs. 2 MStV.
        </div>

        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          <span className="ph">[Vor- und Nachname / ggf. Firmenname]</span>
          <br />
          <span className="ph">[Straße und Hausnummer]</span>
          <br />
          <span className="ph">[PLZ und Ort]</span>
          <br />
          Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: <span className="ph">[Telefonnummer]</span>
          <br />
          E-Mail: <span className="ph">[E-Mail-Adresse]</span>
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
          <br />
          <span className="ph">[USt-IdNr. — oder diesen Abschnitt entfernen, falls keine vorhanden]</span>
        </p>

        <h2>Redaktionell verantwortlich (§ 18 Abs. 2 MStV)</h2>
        <p>
          <span className="ph">[Name]</span>
          <br />
          <span className="ph">[Anschrift wie oben]</span>
        </p>

        <h2>EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener">
            https://ec.europa.eu/consumers/odr/
          </a>
          .<br />
          Unsere E-Mail-Adresse finden Sie oben im Impressum.
        </p>

        <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach
          den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter
          jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
          allgemeinen Gesetzen bleiben hiervon unberührt.
        </p>

        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter (u. a. Ticketanbieter), auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
          Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter
          oder Betreiber der Seiten verantwortlich.
        </p>

        <h2>Urheberrecht</h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
          dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
          Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung
          des jeweiligen Autors bzw. Erstellers.
        </p>
      </section>

      <Footer />
    </>
  );
}
