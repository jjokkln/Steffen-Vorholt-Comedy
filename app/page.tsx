import type { Metadata } from "next";
import Link from "next/link";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";
import HomeGallery from "@/components/HomeGallery";
import Planet from "@/components/Planet";
import Buzzer from "@/components/Buzzer";
import HeroScrollExperience from "@/components/home/HeroScrollExperience";
import SectionTransition from "@/components/home/SectionTransition";
import type { HeroPlanet, HeroPlanetRole } from "@/components/home/hero-types";
import CaptainVideo from "@/components/CaptainVideo";
import YoutubeGallery from "@/components/YoutubeGallery";
import AppearancesSection from "@/components/AppearancesSection";
import JsonLd from "@/components/JsonLd";
import {
  getActiveShows,
  getActiveOneLiners,
  getGalleryItems,
  getPublishedAppearances,
  getReferenceYoutubeVideos,
  getSiteMedia,
} from "@/lib/data";
import { upcomingAppearances } from "@/lib/event-helpers";
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
  const [shows, oneLiners, gallery, heroVideo, referenceVideos, appearances] = await Promise.all([
    getActiveShows(),
    getActiveOneLiners(),
    getGalleryItems(),
    getSiteMedia("hero_video"),
    getReferenceYoutubeVideos(),
    getPublishedAppearances(),
  ]);

  // „Wo Steffen selbst auf der Bühne steht": nur die 3 nächsten Termine, die
  // KEINE eigene Show sind (Gastauftritte, Open Mics, Gigs).
  const homeAppearances = upcomingAppearances(
    appearances.filter((a) => a.kind !== "show"),
    3,
  );

  // 2026-06-26 (Lenny): Planeten reaktiviert (Kundenwunsch). Die 3 aktivsten Shows
  // mit Planeten-Bild werden zu Hero-Planeten – anklickbar (siehe HeroScrollExperience:
  // Hotspot-Overlay → /shows/[slug], Astronaut → /steffen).
  const heroPlanets: HeroPlanet[] = shows
    .filter((s) => s.planet_image_path)
    .slice(0, 3)
    .map((s, index) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      color: s.color,
      imageUrl: mediaUrl(s.planet_image_path),
      role: HERO_ROLES[index] ?? "tertiary",
    }));

  return (
    <>
      <div className="hero-pin-block">
        <HeroScrollExperience planets={heroPlanets} />

        <SectionTransition variant="cards" className="home-shows-pin">
          <span className="drag-handle" aria-hidden="true" />
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
                        size={280}
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
                    <Link className="btn secondary" href="/shows#termine">Tickets</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </SectionTransition>
      </div>

      <SectionTransition variant="track">
        <section className="container section home-events-section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Nicht verpassen</div>
              <h2>Nächste Termine.</h2>
            </div>
            <p>Ticketlinks führen direkt zum externen Anbieter.</p>
          </div>
          <EventGrid limit={3} showFilters={false} />
          <div className="actions">
            <Link className="btn primary" href="/shows#termine">Alle Termine im Kalender</Link>
          </div>
        </section>
      </SectionTransition>

      {homeAppearances.length > 0 && (
        <SectionTransition variant="track">
          <AppearancesSection appearances={homeAppearances} />
        </SectionTransition>
      )}

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
            <HomeGallery items={gallery} />
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
                Comedian, Moderator und Veranstalter aus Recklinghausen. Host von drei eigenen Formaten –
                und der Typ, der auf der Bühne auch dann weitermacht, wenn das Publikum Regie führt.
              </p>
              <div className="actions">
                <Link className="btn primary" href="/kontakt#booking-steffen">Steffen buchen</Link>
                <Link className="btn secondary" href="/kontakt#frage">Frage stellen</Link>
              </div>
            </div>
            <div className="captain-media">
              {heroVideo ? (
                <CaptainVideo src={mediaUrl(heroVideo)} />
              ) : (
                <div className="media-placeholder">Bühnen-Video folgt</div>
              )}
            </div>
          </div>
        </section>
      </SectionTransition>

      {referenceVideos.length > 0 && (
        <SectionTransition variant="reveal">
          <section className="container section home-youtube-section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Reingucken</div>
                <h2>Videos &amp; Referenzen.</h2>
              </div>
              <p>Ausschnitte von der Bühne – für alle, die kein Social Media haben.</p>
            </div>
            <YoutubeGallery videos={referenceVideos.slice(0, 4)} />
          </section>
        </SectionTransition>
      )}

      <JsonLd data={personJsonLd()} />
      <Footer />
    </>
  );
}
