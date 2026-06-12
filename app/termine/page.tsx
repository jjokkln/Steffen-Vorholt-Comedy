import type { Metadata } from "next";
import Calendar from "@/components/Calendar";
import TermineFilters from "@/components/TermineFilters";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getActiveShows, getPublishedEvents } from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";
import { comedyEventJsonLd, eventToJsonLdInput } from "@/lib/jsonld";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Termine & Kalender – Steffen Vorholt",
  description: "Alle Shows, Orte und Ticketlinks von Steffen Vorholt – als Kalender und Liste.",
};

export default async function TerminePage() {
  const [events, shows] = await Promise.all([getPublishedEvents(), getActiveShows()]);
  const { upcoming } = partitionEvents(events);
  const now = new Date();

  return (
    <>
      <header className="container section">
        <div className="eyebrow">🗓️ Termine &amp; Kalender</div>
        <h1>Alle Shows. Alle Orte. Ein Kalender.</h1>
        <p className="lead">
          Wann spielt welche Show wo? Hier findest du jeden Termin – Ticketbuttons führen direkt zum
          externen Anbieter.
        </p>
      </header>

      <section className="container section">
        <div className="public-calendar">
          <div className="eventbar" style={{ marginBottom: "16px" }}>
            {shows.map((s) => (
              <span key={s.id} className="status" style={{ background: s.color, color: "#050711" }}>
                {s.name}
              </span>
            ))}
          </div>
          <Calendar events={events} initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} />
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">🎟️ Alle Termine</div>
            <h2>Finde deine Comedy-Mission.</h2>
          </div>
          <p>Filter nach Show oder Stadt. {upcoming.length} kommende Termine.</p>
        </div>
        <TermineFilters events={upcoming} shows={shows} />
      </section>

      <JsonLd data={upcoming.map((e) => comedyEventJsonLd(eventToJsonLdInput(e)))} />
      <Footer />
    </>
  );
}
