import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Erklärung zur Barrierefreiheit — Pflichtseite aus INSTALL.md Abschnitt 5 des
 * Panels `@growcore/a11y` und Punkt 7 des GrowCore-Pflichtkerns.
 *
 * Sie steht bewusst im Code und nicht in `legal_pages`: Impressum, Datenschutz
 * und AGB beschreiben Steffens Geschäft und gehören ihm; diese Seite beschreibt
 * den technischen Zustand dieser Website und ändert sich mit dem Code. Wer eine
 * Barriere behebt, ändert beides im selben Commit.
 *
 * Der Text sagt ausdrücklich, was NICHT geprüft ist. Eine Erklärung, die pauschal
 * „vollständig konform" behauptet, ist schlechter als eine, die Lücken benennt:
 * Sie ist meistens falsch, und die Bereitschaft zur Nachbesserung ist genau das,
 * was die Norm sehen will. Neue Befunde gehören hierher, nicht in ein Ticket.
 */

/**
 * Feedback-Kontakt. Muss erreichbar sein — eine Erklärung ohne funktionierende
 * Adresse erfüllt ihren einen Zweck nicht. Dieselbe Adresse wie im Impressum
 * (Tabelle `legal_pages`); ändert sie sich dort, hier mitziehen.
 *
 * Bewusst ein `mailto:` und kein Formular: Ein Formular wäre selbst eine
 * Barriere, wenn jemand es genau deshalb nicht bedienen kann.
 */
const FEEDBACK_EMAIL = "steffen.vorholt.comedyshows@gmail.com";

/** Stand dieser Erklärung. Bei jeder Prüfung mitziehen, sonst altert sie lautlos. */
const STAND = "22. September 2026";

export const metadata: Metadata = {
  title: "Erklärung zur Barrierefreiheit",
  description:
    "Stand der Barrierefreiheit dieser Website, bekannte Einschränkungen und wie du Barrieren melden kannst.",
  alternates: { canonical: "/barrierefreiheit" },
};

export default function BarrierefreiheitPage() {
  return (
    <>
      <main id="hauptinhalt">
      <section className="container section legal">
        <div className="eyebrow">♿ Barrierefreiheit</div>
        <h1>Erklärung zur Barrierefreiheit</h1>
        <p>Für steffenvorholt.de. Stand: {STAND}.</p>

        <h2>Was wir anstreben</h2>
        <p>
          Diese Seite soll für alle nutzbar sein — auch mit Screenreader, ausschließlich
          über die Tastatur, mit starker Vergrößerung oder bei eingeschränktem Farbsehen.
          Maßstab sind die <strong>Web Content Accessibility Guidelines 2.1, Stufe AA</strong>{" "}
          in der Fassung der EN 301 549, die auch das Barrierefreiheitsstärkungsgesetz
          zugrunde legt.
        </p>
        <p>
          Diese Erklärung beschreibt den <em>tatsächlichen</em> Stand, nicht den
          gewünschten.
        </p>

        <h2>Stand der Vereinbarkeit: teilweise vereinbar</h2>
        <p>
          Die Website ist <strong>teilweise</strong> mit WCAG 2.1 AA vereinbar.
          „Teilweise" heißt hier konkret: Eine vollständige Prüfung durch Dritte hat{" "}
          <strong>nicht</strong> stattgefunden.
        </p>
        <p>
          <strong>Bekannte Einschränkungen:</strong>
        </p>
        <ul>
          <li>
            <strong>Kein vollständiges Audit.</strong> Geprüft wurde bisher mit
            automatisierten Werkzeugen und stichprobenhaft per Tastatur. Automatische
            Prüfungen finden erfahrungsgemäß nur etwa ein Drittel der Probleme.
          </li>
          <li>
            <strong>Die Kontrastmodi greifen nicht überall.</strong> Flächen, Fließtext
            und Ränder schalten um; die Farbverläufe des Weltraum-Designs, Schatten und
            die Akzentfarben der einzelnen Shows behalten ihre Farbwerte. In den
            Hochkontrast-Modi bleiben diese Stellen deshalb bunt.
          </li>
          <li>
            <strong>Farbausgleich nicht in jedem Browser.</strong> Der Ausgleich für
            Farbfehlsichtigkeit steht in Firefox nicht zur Verfügung, weil dieser Browser
            die dafür nötige Darstellung nicht unterstützt. In Chrome, Edge und Safari
            funktioniert er. Alle anderen Einstellungen wirken überall.
          </li>
          <li>
            <strong>Bewegung auf der Startseite.</strong> Die Startseite hat eine an das
            Scrollen gekoppelte Kamerafahrt und einen Sternenhintergrund. Wer Bewegung
            nicht verträgt, kann sie im Panel unter „Animationen anhalten" abschalten.
          </li>
          <li>
            <strong>Videos ohne Untertitel.</strong> Die eingebundenen Show-Videos und
            Trailer haben keine Untertitel und keine Audiodeskription.
          </li>
          <li>
            <strong>Eingebettete Inhalte Dritter.</strong> Für YouTube, Instagram, TikTok
            und Facebook — die erst nach deiner Zustimmung laden — können wir keine
            Barrierefreiheit zusichern; sie entstehen außerhalb dieser Website.
          </li>
        </ul>

        <h2>Was das Panel leistet — und was nicht</h2>
        <p>
          Unten links findest du eine Schaltfläche, mit der du Schriftgröße, Zeilen- und
          Buchstabenabstand, Kontrast, Farbsättigung, Blaulichtfilter und mehrere
          Lesehilfen einstellen kannst. Die Einstellung gilt nur für dich, wird auf deinem
          Gerät gespeichert und verlässt es nicht — kein Cookie, kein Server. Öffnen geht
          auch mit <kbd>Alt</kbd> + <kbd>0</kbd>.
        </p>
        <p>
          <strong>Dieses Panel ersetzt keine barrierefreie Website.</strong> Es kann Text
          größer machen, aber keine fehlende Bildbeschreibung erfinden und keine Bedienung
          reparieren, die ohne Maus nicht funktioniert. Wir sagen das ausdrücklich, weil
          solche Werkzeuge oft als Nachweis von Barrierefreiheit verkauft werden — das
          sind sie nicht. Wenn dir etwas im Weg steht, ist das ein Fehler bei uns und
          keiner, den du mit einem Schalter beheben sollst.
        </p>
        <p>
          Bewusst nicht eingebaut: eine Erkennung, ob du ein Hilfsmittel verwendest. Das
          wäre eine Information über deine Gesundheit, und die geht uns nichts an.
        </p>

        <h2>Barriere melden</h2>
        <p>
          Wenn dir etwas auffällt — eine Stelle, die du mit der Tastatur nicht erreichst,
          ein Text, der zu schwach ist, eine Grafik ohne Beschreibung: schreib uns.
        </p>
        <p>
          <a href={`mailto:${FEEDBACK_EMAIL}?subject=Barriere%20auf%20steffenvorholt.de`}>
            {FEEDBACK_EMAIL}
          </a>
        </p>
        <p>
          Wir antworten innerhalb von zwei Wochen. Bitte beschreibe möglichst, auf welcher
          Seite es passiert ist und welches Gerät oder Hilfsmittel du verwendest — das
          verkürzt die Suche erheblich.
        </p>
        <p>
          Bist du mit der Antwort nicht zufrieden, kannst du dich an die
          Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und
          Dienstleistungen (MLBF) wenden.
        </p>

        <p>
          <Link href="/">Zurück zur Startseite</Link>
        </p>
      </section>
      </main>
      <Footer />
    </>
  );
}
