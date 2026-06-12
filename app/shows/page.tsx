import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getActiveShows } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shows – Steffen Vorholt",
  description: "Alle Comedy-Formate von Steffen Vorholt im Überblick.",
};

export default async function ShowsPage() {
  const shows = await getActiveShows();
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🪐 Wähle deine Mission</div>
        <h1>Jede Show ein eigener Planet.</h1>
        <p className="lead">Impro, Open Mic oder Boarding – such dir aus, wo du landen willst.</p>
      </header>

      <section className="container section">
        <div className="grid-3">
          {shows.map((show) => (
            <article className="card show-card" key={show.id}>
              <div>
                <div className="top">
                  <span className="badge">{show.name}</span>
                  <span className="badge">{show.format_label}</span>
                </div>
                <div className="show-art">
                  <img src={mediaUrl(show.planet_image_path)} alt={`Planet der Show ${show.name}`} />
                </div>
                <div className="show-card-copy">
                  <h3>{show.tagline}</h3>
                  <p>{show.description}</p>
                </div>
              </div>
              <div className="actions">
                <Link className="btn primary" href={`/shows/${show.slug}`}>
                  Show öffnen
                </Link>
                <Link className="btn secondary" href="/termine">
                  Tickets
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
