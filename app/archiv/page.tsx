import type { Metadata } from "next";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Archiv – Steffen Vorholt",
  description: "Vergangene Shows und Social Proof.",
};

export default function ArchivPage() {
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🛰️ Archiv</div>
        <h1>Vergangene Missionen.</h1>
        <p className="lead">
          Das Archiv zeigt vergangene Shows, Städte, Locations, Fotos und Recaps. So entsteht Social
          Proof und die Shows wirken lebendig.
        </p>
      </header>

      <section className="container section">
        <EventGrid />
      </section>

      <section className="container section">
        <div className="grid-2">
          <div className="card">
            <h3>Brain Loading Städte</h3>
            <p>Bochum, Dortmund, Dortmund Uni, Düsseldorf, Essen, Köln, Oberhausen.</p>
          </div>
          <div className="card">
            <h3>Medien im Archiv</h3>
            <p>Pro Event: 3–8 Fotos, 1 kurzer Reel-/TikTok-Link, optional kurzer Recap-Text.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
