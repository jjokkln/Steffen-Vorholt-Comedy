import type { Metadata } from "next";
import Link from "next/link";
import EventSummary from "@/components/EventSummary";
import BookingList from "@/components/BookingList";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Show-Kalender – Steffen Vorholt",
  description: "Kalenderübersicht für alle Shows, Orte und Ticketlinks.",
};

export default function KalenderPage() {
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🗓️ Show-Kalender</div>
        <h1>Alle Shows. Alle Orte. Ein Kalender.</h1>
        <p className="lead">
          Diese Seite ist die zentrale Buchungsübersicht. Besucher sehen sofort, wann welche Show wo
          stattfindet und kommen direkt zum externen Ticketlink.
        </p>
      </header>

      <section className="container section">
        <div className="booking-layout">
          <aside className="booking-sidebar card">
            <h3>Shows filtern</h3>
            <p>Für jede Show gibt es zusätzlich eine eigene Terminübersicht.</p>
            <EventSummary />
            <div className="actions">
              <Link className="btn primary" href="/termine">
                Listenansicht
              </Link>
              <Link className="btn secondary" href="/admin/termine">
                Termin pflegen
              </Link>
            </div>
          </aside>

          <main>
            <div className="public-calendar">
              <div className="calendar-head">
                <div>
                  <span className="badge">Kalenderansicht</span>
                  <h3>Show-Monat</h3>
                </div>
                <div className="eventbar">
                  <span className="status live">Brain Loading</span>
                  <span className="status archive">Comedy Eiskalt</span>
                  <span className="status draft">Comedy Check-In</span>
                </div>
              </div>
            </div>

            <div className="section-head" style={{ marginTop: "36px" }}>
              <div>
                <div className="eyebrow">🎟️ Alle Buchungsoptionen</div>
                <h2>Listenübersicht.</h2>
              </div>
              <p>Für Mobile und schnelle Buchung ist die Liste wichtiger als der Kalender.</p>
            </div>
            <BookingList />
          </main>
        </div>
      </section>

      <Footer />
    </>
  );
}
