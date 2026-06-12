import type { Metadata } from "next";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Steffen Vorholt – Comedy-Universum",
  description: "Drei Shows. Ein Host. Unendlich viele Lacher.",
};

export default function HomePage() {
  return (
    <>
      <HomeHero />

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">🪐 Wähle deine Mission</div>
            <h2>Drei Formate. Drei Planeten.</h2>
          </div>
          <p>Jede Show bekommt eine eigene Welt, eigene Farbe und eigene Micro-Interactions.</p>
        </div>
        <div className="grid-3">
          <article className="card show-card brain">
            <div>
              <div className="top">
                <span className="badge">Brain Loading</span>
                <span className="badge">Impro</span>
              </div>
              <div className="show-art">
                <img
                  src="/assets/media/shows/brain-loading/brain-loading-planet.webp"
                  alt="Brain-Loading-Planet"
                />
              </div>
              <div className="show-card-copy">
                <h3>Du führst Regie.</h3>
                <p>
                  Stand-up trifft Impro: In der zweiten Hälfte bekommt das Publikum per Buzzer das
                  Kommando.
                </p>
              </div>
            </div>
            <div className="actions">
              <Link className="btn primary" href="/shows/brain-loading">
                Show öffnen
              </Link>
              <Link className="btn secondary" href="/termine">
                Tickets
              </Link>
            </div>
          </article>

          <article className="card show-card ice">
            <div>
              <div className="top">
                <span className="badge">Comedy Eiskalt</span>
                <span className="badge">Open Mic</span>
              </div>
              <div className="show-art">
                <img
                  src="/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp"
                  alt="Comedy-Eiskalt-Planet"
                />
              </div>
              <div className="show-card-copy">
                <h3>Brich mit uns das Eis.</h3>
                <p>
                  Das Open-Mic-Format in der Eissportarena Bergisch Gladbach: roh, direkt und fair
                  für Künstler.
                </p>
              </div>
            </div>
            <div className="actions">
              <Link className="btn primary" href="/shows/comedy-eiskalt">
                Show öffnen
              </Link>
              <Link className="btn secondary" href="/kontakt#bewerben">
                Bewerben
              </Link>
            </div>
          </article>

          <article className="card show-card checkin">
            <div>
              <div className="top">
                <span className="badge">Comedy Check-In</span>
                <span className="badge">Captain</span>
              </div>
              <div className="show-art">
                <img
                  src="/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp"
                  alt="Comedy-Check-In-Planet"
                />
              </div>
              <div className="show-card-copy">
                <h3>Boarding in die Comedy-Galaxie.</h3>
                <p>
                  Captain Steffen und ein wechselnder Co-Pilot steuern das Publikum durch einen
                  besonderen Comedy-Abend.
                </p>
              </div>
            </div>
            <div className="actions">
              <Link className="btn primary" href="/shows/comedy-check-in">
                Show öffnen
              </Link>
              <Link className="btn secondary" href="/termine">
                Tickets
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">🎟️ Ticket-Fokus</div>
            <h2>Nächste Termine.</h2>
          </div>
          <p>Ticketlinks führen extern. Vergangene konkrete Beispiele sind als Archiv markiert.</p>
        </div>
        <EventGrid />
        <div className="actions">
          <Link className="btn primary" href="/termine">
            Alle Termine ansehen
          </Link>
        </div>
      </section>

      <section className="container section">
        <div className="feature">
          <div>
            <div className="eyebrow">📸 Social Proof</div>
            <h2>Videos von der Bühne.</h2>
            <p>
              Dieser Bereich wird später mit Instagram-Reels, TikToks oder YouTube-Clips gefüllt.
              Wichtig: echte Bühnenenergie vor Design-Spielerei.
            </p>
            <div className="actions">
              <Link className="btn secondary" href="/termine">
                Alle Termine
              </Link>
            </div>
          </div>
          <div className="media-placeholder">
            Benötigt: steffen-stage-loop-hero.webm
            <br />+ 3 bis 6 kurze Bühnenclips
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
