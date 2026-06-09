import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Comedy Check-In – Steffen Vorholt",
  description: "Comedy Check-In ist dein Boarding in die Comedy-Galaxie.",
};

export default function ComedyCheckInPage() {
  return (
    <>
      <header className="container section hero">
        <div>
          <div className="eyebrow">
            <span className="dot"></span> Comedy Check-In
          </div>
          <h1>Dein Boarding in die Comedy-Galaxie.</h1>
          <p className="lead">
            Willkommen beim Comedy Check-In: Captain Steffen Vorholt und ein wechselnder Co-Pilot
            steuern dich durch einen unvergesslich lustigen Abend.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/shows/comedy-check-in-termine">
              Comedy-Check-In-Kalender
            </Link>
            <Link className="btn secondary" href="/archiv">
              Archiv ansehen
            </Link>
          </div>
        </div>
        <figure className="show-hero-media checkin-hero">
          <img
            src="/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp"
            alt="Comedy Check-In – Boarding in die Comedy-Galaxie"
          />
        </figure>
      </header>

      <section className="container section">
        <div className="grid-2">
          <div className="card">
            <h3>Show-Mechanik</h3>
            <p>
              Beim Spiel „Dein Moderator hat…“ treten zwei Zuschauer-Teams gegeneinander an und
              ordnen echte Fakten dem richtigen Moderator zu.
            </p>
          </div>
          <div className="card">
            <h3>Designwelt</h3>
            <p>Airport-Display, Boarding-Pässe, Flugroute, Captain-Wording und Check-In-Animationen.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
