import type { Metadata } from "next";
import Image from "next/image";
import Footer from "@/components/Footer";
import { getActiveOffers } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Angebote",
  description:
    "Aktuelle Aktionen rund um Steffen Vorholts Comedy-Shows – z. B. Rettember und den Missions Pass.",
};

export default async function AngebotePage() {
  const offers = await getActiveOffers();

  return (
    <>
      <header className="container section">
        <div className="eyebrow">🚀 Angebote</div>
        <h1>Aktuelle Aktionen.</h1>
        <p className="lead">
          Spar-Codes, Aktionen und besondere Deals – schnapp sie dir, solange sie laufen.
        </p>
      </header>

      <section className="container section">
        {offers.length === 0 ? (
          <div className="booking-empty">
            Gerade keine Aktion aktiv – aber Steffen heckt bestimmt schon die nächste aus. Schau bald
            wieder rein!
          </div>
        ) : (
          <div className="grid-2 offer-grid">
            {offers.map((o) => (
              <article className="card offer-card" key={o.id}>
                {o.image_path && (
                  <div className="offer-poster-wrap">
                    <span className="offer-badge">Aktion</span>
                    <Image
                      className="offer-poster"
                      src={mediaUrl(o.image_path)}
                      alt={o.title}
                      width={600}
                      height={400}
                      sizes="(max-width: 900px) 92vw, 600px"
                    />
                  </div>
                )}
                <div className="offer-body">
                  <h3>{o.title}</h3>
                  {o.subtitle && <p className="offer-subtitle">{o.subtitle}</p>}
                  {o.description && <p>{o.description}</p>}
                  {o.code && (
                    <p className="offer-code">
                      Code: <span>{o.code}</span>
                    </p>
                  )}
                  {o.validity && <p className="offer-validity">{o.validity}</p>}
                  {o.url && (
                    <a className="btn primary" href={o.url} target="_blank" rel="noopener noreferrer">
                      Zur Aktion
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
