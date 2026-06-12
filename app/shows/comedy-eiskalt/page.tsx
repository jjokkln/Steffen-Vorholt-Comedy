import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comedy Eiskalt – Steffen Vorholt",
  description: "Comedy Eiskalt ist das Comedy-Open-Mic in Bergisch Gladbach.",
};

export default function ComedyEiskaltPage() {
  return (
    <>
      <header className="container section hero">
        <div>
          <div className="eyebrow">
            <span className="dot"></span> Comedy Eiskalt
          </div>
          <h1>Das coolste Comedy-Open-Mic der Galaxie.</h1>
          <p className="lead">
            Mutige Newcomer testen ihre ersten Witze, erfahrene Comedians bringen frisches oder
            bewährtes Material auf die Bühne und ein Profi sorgt am Ende für stabile Lacher.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/shows/comedy-eiskalt-termine">
              Comedy-Eiskalt-Kalender
            </Link>
            <Link className="btn secondary" href="/kontakt#bewerben">
              Comedian bewerben
            </Link>
          </div>
        </div>
        <figure className="show-hero-media ice-hero">
          <img
            src="/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp"
            alt="Comedy Eiskalt – das Comedy-Open-Mic"
          />
        </figure>
      </header>

      <section className="container section">
        <div className="grid-2">
          <div className="card">
            <h3>Location</h3>
            <p>
              Eissportarena Bergisch Gladbach, Saaler Straße 100, 51429 Bergisch Gladbach. 1x im
              Monat samstags. Beginn 20:00 Uhr, Ende 22:15 Uhr.
            </p>
          </div>
          <div className="card">
            <h3>Wichtig</h3>
            <p>
              Keine klassische Abendkasse. Faire Bezahlung der Künstler steht im Mittelpunkt.
              Ticketkauf soll planbar über externe Anbieter laufen.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
