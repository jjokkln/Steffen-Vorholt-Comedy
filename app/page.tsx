import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";
import Planet from "@/components/Planet";
import Buzzer from "@/components/Buzzer";
import Reveal from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import WordReveal from "@/components/motion/WordReveal";
import MouseParallax from "@/components/motion/MouseParallax";
import JsonLd from "@/components/JsonLd";
import { getActiveShows, getActiveOneLiners, getGalleryItems, getSiteMedia } from "@/lib/data";
import { personJsonLd } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Steffen Vorholt – Comedy aus einer anderen Galaxie",
  description:
    "Drei Shows. Ein Host. Unendlich viele Lacher. Impro, Open Mic und Boarding-Comedy aus NRW – Termine, Tickets und Booking.",
};

const CLUSTER_POS = [
  { left: "4%", top: "4%", size: 180, rotation: "-3deg", orbit: true },
  { right: "4%", top: "34%", size: 125, rotation: "4deg", orbit: false },
  { left: "32%", bottom: "0%", size: 95, rotation: "-5deg", orbit: false },
];

export default async function HomePage() {
  const [shows, oneLiners, gallery, heroVideo] = await Promise.all([
    getActiveShows(),
    getActiveOneLiners(),
    getGalleryItems(),
    getSiteMedia("hero_video"),
  ]);

  return (
    <>
      <div className="shooting-star" aria-hidden="true" />
      <Ticker />

      {/* Hero */}
      <header className="container section hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot"></span> LIVE-COMEDY AUS NRW
          </div>
          <h1>
            <WordReveal text="Comedy aus einer anderen" />{" "}
            <em className="gradient" style={{ fontStyle: "italic" }}>
              <WordReveal text="Galaxie." />
            </em>
          </h1>
          <p className="lead">
            Drei Shows, ein Host: Steffen Vorholt bringt Impro, Open Mic und Boarding-Comedy auf die
            Bühnen von NRW.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/termine">
              🎟 Tickets sichern
            </Link>
            <Link className="btn secondary" href="/shows">
              Welche Show passt zu mir?
            </Link>
          </div>
          <div className="proof-row">
            <span>
              <Counter to={47} /> Shows gespielt
            </span>
            <span>
              <Counter to={6} /> Städte
            </span>
            <span>
              <Counter to={shows.length} /> eigene Formate
            </span>
          </div>
        </div>
        <MouseParallax>
          <div className="hero-cluster" aria-hidden="true">
            {shows.slice(0, 3).map((show, i) => {
              const pos = CLUSTER_POS[i];
              const { size, rotation, orbit, ...placement } = pos;
              return (
                <span className="cluster-item" style={placement} key={show.id}>
                  <Planet
                    src={show.planet_image_path}
                    alt=""
                    size={size}
                    color={show.color}
                    sticker={show.name}
                    rotation={rotation}
                    withOrbit={orbit}
                  />
                </span>
              );
            })}
          </div>
        </MouseParallax>
      </header>

      {/* Shows */}
      <section className="container section">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">🪐 Wähle deine Mission</div>
              <h2>Jede Show ein eigener Planet.</h2>
            </div>
            <p>Eigene Welt, eigene Farbe, eigener Humor – such dir aus, wo du landest.</p>
          </div>
        </Reveal>
        <div className="grid-3">
          {shows.map((show, i) => (
            <Reveal key={show.id} delay={i * 0.12}>
              <article className="card show-card">
                <div>
                  <div className="top">
                    <span className="badge">{show.name}</span>
                    <span className="badge">{show.format_label}</span>
                  </div>
                  <div className="show-art">
                    <Planet src={show.planet_image_path} alt={`Planet der Show ${show.name}`} size={150} color={show.color} />
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
            </Reveal>
          ))}
        </div>
      </section>

      {/* Nächste Termine */}
      <section className="container section">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">🎟️ Nicht verpassen</div>
              <h2>Nächste Termine.</h2>
            </div>
            <p>Ticketlinks führen direkt zum externen Anbieter.</p>
          </div>
        </Reveal>
        <EventGrid limit={3} />
        <Reveal>
          <div className="actions">
            <Link className="btn primary" href="/termine">
              Alle Termine im Kalender
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Buzzer */}
      <section className="container section">
        <Reveal>
          <div className="section-head" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <div className="eyebrow">🔴 Wie bei Brain Loading</div>
              <h2>Du hast das Kommando.</h2>
            </div>
          </div>
          <Buzzer oneLiners={oneLiners.map((l) => l.text)} />
        </Reveal>
      </section>

      {/* Vergangene Missionen */}
      {gallery.length > 0 && (
        <section className="container section">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">🛰️ Vergangene Missionen</div>
                <h2>Beweisfotos.</h2>
              </div>
              <p>Echte Bühnen, echtes Publikum, echte Lacher.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="gallery-grid">
              {gallery.map((g, i) => (
                <figure key={g.id} style={{ "--rot": `${(i % 3) - 1}deg` } as React.CSSProperties}>
                  <Image
                    src={mediaUrl(g.image_path)}
                    alt={g.caption || "Showfoto"}
                    width={800}
                    height={600}
                    style={{ width: "100%", height: 220, objectFit: "cover" }}
                  />
                  {g.caption && <figcaption>{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Steffen */}
      <section className="container section">
        <Reveal>
          <div className="feature">
            <div>
              <div className="eyebrow">👨‍🚀 Der Captain</div>
              <h2>Steffen Vorholt.</h2>
              <p>
                Comedian, Moderator und Veranstalter aus Neuss. Host von drei eigenen Formaten –
                und der Typ, der auf der Bühne auch dann weitermacht, wenn das Publikum Regie führt.
              </p>
              <div className="actions">
                <Link className="btn primary" href="/kontakt">
                  🎤 Steffen buchen
                </Link>
                <Link className="btn secondary" href="/kontakt#bewerben">
                  Als Comedian bewerben
                </Link>
              </div>
            </div>
            {heroVideo ? (
              <video
                src={mediaUrl(heroVideo)}
                autoPlay
                muted
                loop
                playsInline
                style={{ borderRadius: 24, border: "1px solid var(--line)" }}
              />
            ) : (
              <div className="media-placeholder">Bühnen-Video folgt</div>
            )}
          </div>
        </Reveal>
      </section>

      <JsonLd data={personJsonLd()} />
      <Footer />
    </>
  );
}
