import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";
import Planet from "@/components/Planet";
import Buzzer from "@/components/Buzzer";
import HeroScrollExperience from "@/components/home/HeroScrollExperience";
import SectionTransition from "@/components/home/SectionTransition";
import type { HeroPlanetRole } from "@/components/home/hero-types";
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

const HERO_ROLES: HeroPlanetRole[] = ["primary", "secondary", "tertiary"];

export default async function HomePage() {
  const [shows, oneLiners, gallery, heroVideo] = await Promise.all([
    getActiveShows(),
    getActiveOneLiners(),
    getGalleryItems(),
    getSiteMedia("hero_video"),
  ]);

  const heroShows = [...shows]
    .filter((show) => show.planet_image_path)
    .sort((a, b) => {
      if (a.slug === "brain-loading") return -1;
      if (b.slug === "brain-loading") return 1;
      return a.sort_order - b.sort_order;
    })
    .slice(0, 3);

  const heroPlanets = heroShows.map((show, index) => ({
    id: show.id,
    slug: show.slug,
    name: show.name,
    color: show.color,
    imageUrl: mediaUrl(show.planet_image_path),
    role: HERO_ROLES[index],
  }));

  return (
    <>
      <Ticker />
      <HeroScrollExperience
        planets={heroPlanets}
        showCount={47}
        cityCount={6}
        formatCount={shows.length}
      />

      <SectionTransition variant="cards">
        <section className="container section home-shows-section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Wähl deine Mission</div>
              <h2>Jede Show ein eigener Planet.</h2>
            </div>
            <p>Eigene Welt, eigene Farbe, eigener Humor – such dir aus, wo du landest.</p>
          </div>
          <div className="grid-3">
            {shows.map((show) => (
              <article className="card show-card" key={show.id}>
                <div>
                  <div className="top">
                    <span className="badge">{show.name}</span>
                    <span className="badge">{show.format_label}</span>
                  </div>
                  <div className="show-art">
                    <Planet
                      src={show.planet_image_path}
                      alt={`Planet der Show ${show.name}`}
                      size={150}
                      color={show.color}
                    />
                  </div>
                  <div className="show-card-copy">
                    <h3>{show.tagline}</h3>
                    <p>{show.description}</p>
                  </div>
                </div>
                <div className="actions">
                  <Link className="btn primary" href={`/shows/${show.slug}`}>Show öffnen</Link>
                  <Link className="btn secondary" href="/termine">Tickets</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </SectionTransition>

      <SectionTransition variant="track">
        <section className="container section home-events-section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Nicht verpassen</div>
              <h2>Nächste Termine.</h2>
            </div>
            <p>Ticketlinks führen direkt zum externen Anbieter.</p>
          </div>
          <EventGrid limit={3} />
          <div className="actions">
            <Link className="btn primary" href="/termine">Alle Termine im Kalender</Link>
          </div>
        </section>
      </SectionTransition>

      <SectionTransition variant="reveal">
        <section className="container section home-buzzer-section">
          <div className="section-head" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <div className="eyebrow">Wie bei Brain Loading</div>
              <h2>Du hast das Kommando.</h2>
            </div>
          </div>
          <Buzzer oneLiners={oneLiners.map((line) => line.text)} />
        </section>
      </SectionTransition>

      {gallery.length > 0 && (
        <SectionTransition variant="archive">
          <section className="container section home-gallery-section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Vergangene Missionen</div>
                <h2>Beweisfotos.</h2>
              </div>
              <p>Echte Bühnen, echtes Publikum, echte Lacher.</p>
            </div>
            <div className="gallery-grid">
              {gallery.map((item, index) => (
                <figure
                  key={item.id}
                  style={{ "--rot": `${(index % 3) - 1}deg` } as CSSProperties}
                >
                  <Image
                    src={mediaUrl(item.image_path)}
                    alt={item.caption || "Showfoto"}
                    width={800}
                    height={600}
                    style={{ width: "100%", height: 220, objectFit: "cover" }}
                  />
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        </SectionTransition>
      )}

      <SectionTransition variant="reveal">
        <section className="container section home-captain-section">
          <div className="feature">
            <div>
              <div className="eyebrow">Der Captain</div>
              <h2>Steffen Vorholt.</h2>
              <p>
                Comedian, Moderator und Veranstalter aus Neuss. Host von drei eigenen Formaten –
                und der Typ, der auf der Bühne auch dann weitermacht, wenn das Publikum Regie führt.
              </p>
              <div className="actions">
                <Link className="btn primary" href="/kontakt">Steffen buchen</Link>
                <Link className="btn secondary" href="/kontakt#bewerben">Als Comedian bewerben</Link>
              </div>
            </div>
            <div className="captain-media">
              {heroVideo ? (
                <video
                  src={mediaUrl(heroVideo)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ) : (
                <div className="media-placeholder">Bühnen-Video folgt</div>
              )}
            </div>
          </div>
        </section>
      </SectionTransition>

      <JsonLd data={personJsonLd()} />
      <Footer />
    </>
  );
}
