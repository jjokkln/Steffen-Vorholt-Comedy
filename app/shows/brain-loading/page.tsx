import type { Metadata } from "next";
import Link from "next/link";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Brain Loading – Steffen Vorholt",
  description: "Brain Loading ist die Comedy-Improshow, bei der das Publikum Regie führt.",
};

export default function BrainLoadingPage() {
  return (
    <>
      <header className="container section hero">
        <div>
          <div className="eyebrow">
            <span className="dot"></span> Brain Loading
          </div>
          <h1>Die Comedy-Improshow, bei der du Regie führst.</h1>
          <p className="lead">
            Hier trifft klassische Stand-up-Comedy auf einen unvorhersehbaren Impro-Teil. In der
            ersten Hälfte zeigen Comedians ihr Set. In der zweiten Hälfte entscheidet das Publikum
            per Buzzer, wie oft Ort, Aktion oder Figur wechseln.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/shows/brain-loading-termine">
              Brain-Loading-Kalender
            </Link>
            <Link className="btn secondary" href="/kontakt#bewerben">
              Als Comedian bewerben
            </Link>
          </div>
        </div>
        <figure className="show-hero-media brain-hero">
          <img
            src="/assets/media/shows/brain-loading/brain-loading-hero.webp"
            alt="Illustration zur Comedy-Improshow Brain Loading"
          />
        </figure>
      </header>

      <section className="container section">
        <div className="grid-2">
          <div className="card">
            <h3>Show-Prinzip</h3>
            <ul className="list">
              <li>
                <b>Hälfte 1</b>
                <span>Comedians aus ganz Deutschland zeigen ihr bestes Set.</span>
              </li>
              <li>
                <b>Buzzer</b>
                <span>Ein Zuschauer bekommt das Kommando.</span>
              </li>
              <li>
                <b>Hälfte 2</b>
                <span>Impro-Storys wechseln Ort, Aktion oder Figur.</span>
              </li>
            </ul>
          </div>
          <div className="card">
            <h3>Städte & Locations</h3>
            <p>
              Öffentlich genannt: Bochum, Dortmund, Dortmund Uni, Düsseldorf, Essen, Köln und
              Oberhausen. Aktuell beschrieben als 47 Shows in 7 tollen Locations und 6 Städten.
            </p>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Brain-Loading-Termine</h2>
          <p>Vergangene konkrete Beispiele sind im Archiv markiert.</p>
        </div>
        <EventGrid showOnly="Brain Loading" />
      </section>

      <Footer />
    </>
  );
}
