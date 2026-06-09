import type { Metadata } from "next";
import TermineFilters from "@/components/TermineFilters";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Termine & Tickets – Steffen Vorholt",
  description: "Alle Termine und externe Ticketlinks für Steffens Shows.",
};

export default function TerminePage() {
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🎟️ Termine & Tickets</div>
        <h1>Finde deine Comedy-Mission.</h1>
        <p className="lead">
          Filter nach Show oder Stadt. Ticketbuttons führen direkt zu externen Anbietern. Eigener
          Ticketverkauf ist nicht Teil des MVP.
        </p>
      </header>

      <section className="container section">
        <TermineFilters />
      </section>

      <Footer />
    </>
  );
}
