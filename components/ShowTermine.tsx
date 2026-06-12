import Link from "next/link";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";

export default function ShowTermine({
  show,
  slug,
  colorClass,
  lead,
}: {
  show: string;
  slug: string;
  colorClass: "brain" | "ice" | "checkin";
  lead: string;
}) {
  return (
    <>
      <header className="container section show-calendar-hero">
        <div>
          <div className="eyebrow">🗓️ {show}</div>
          <h1>{show} Kalender.</h1>
          <p className="lead">{lead}</p>
          <div className="actions">
            <Link className="btn primary" href="/termine">
              Alle Shows ansehen
            </Link>
            <Link className="btn secondary" href={`/shows/${slug}`}>
              Zur Showseite
            </Link>
          </div>
        </div>
        <article className={`card show-card ${colorClass}`}>
          <div>
            <span className="badge">{show}</span>
            <div className="spacer"></div>
            <h3>Nur diese Show.</h3>
            <p>Diese Seite ist für Besucher, die schon wissen, welches Format sie sehen möchten.</p>
          </div>
        </article>
      </header>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">🎟️ Buchungsübersicht</div>
            <h2>Termine & Ticketlinks.</h2>
          </div>
          <p>Im finalen Build kommen diese Daten aus Supabase und können im Admin gepflegt werden.</p>
        </div>
        <EventGrid showOnly={show} includePast />
      </section>

      <section className="container section">
        <div className="grid-2">
          <div className="card">
            <h3>Admin-Felder für diese Übersicht</h3>
            <ul className="list">
              <li>
                <b>Datum & Uhrzeit</b>
                <span>inkl. Einlass und Status.</span>
              </li>
              <li>
                <b>Stadt & Location</b>
                <span>aus wiederverwendbaren Location-Daten.</span>
              </li>
              <li>
                <b>Ticketlink</b>
                <span>extern: Eventbrite, Rausgegangen, Eventim, Reservix oder eigene Seite.</span>
              </li>
            </ul>
          </div>
          <div className="card">
            <h3>Öffentliche Logik</h3>
            <p>
              Wenn keine kommenden Termine gepflegt sind, erscheint kein kaputter Kalender, sondern
              ein klarer Hinweis: „Neue Termine folgen“ plus CTA zu Instagram oder Newsletter.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
