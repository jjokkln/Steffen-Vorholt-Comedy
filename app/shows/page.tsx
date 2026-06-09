import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Shows – Steffen Vorholt",
  description: "Brain Loading, Comedy Eiskalt und Comedy Check-In.",
};

export default function ShowsPage() {
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🪐 Shows</div>
        <h1>Drei Shows als eigene Welten.</h1>
        <p className="lead">
          Das Comedy-Universum besteht aus Brain Loading, Comedy Eiskalt und Comedy Check-In. Jede
          Show bekommt eigene Farben, eigene Animationen und eine klare Ticketstrecke.
        </p>
      </header>

      <section className="container section">
        <div className="grid-3">
          <article className="card show-card brain">
            <div>
              <span className="badge">Brain Loading</span>
              <div className="show-art">
                <img
                  src="/assets/media/shows/brain-loading/brain-loading-planet.webp"
                  alt="Brain-Loading-Planet"
                />
              </div>
              <div className="show-card-copy">
                <h3>Impro mit Buzzer.</h3>
                <p>Das Publikum entscheidet Ort, Aktion oder Figur in der improvisierten Story.</p>
              </div>
            </div>
            <Link className="btn primary" href="/shows/brain-loading">
              Öffnen
            </Link>
          </article>

          <article className="card show-card ice">
            <div>
              <span className="badge">Comedy Eiskalt</span>
              <div className="show-art">
                <img
                  src="/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp"
                  alt="Comedy-Eiskalt-Planet"
                />
              </div>
              <div className="show-card-copy">
                <h3>Open Mic im Eis.</h3>
                <p>Newcomer, erfahrene Comedians und ein Profi-Finale in Bergisch Gladbach.</p>
              </div>
            </div>
            <Link className="btn primary" href="/shows/comedy-eiskalt">
              Öffnen
            </Link>
          </article>

          <article className="card show-card checkin">
            <div>
              <span className="badge">Comedy Check-In</span>
              <div className="show-art">
                <img
                  src="/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp"
                  alt="Comedy-Check-In-Planet"
                />
              </div>
              <div className="show-card-copy">
                <h3>Captain & Co-Pilot.</h3>
                <p>Comedy-Abend mit zwei Moderatoren und dem Spiel „Dein Moderator hat…“.</p>
              </div>
            </div>
            <Link className="btn primary" href="/shows/comedy-check-in">
              Öffnen
            </Link>
          </article>
        </div>
      </section>

      <Footer />
    </>
  );
}
