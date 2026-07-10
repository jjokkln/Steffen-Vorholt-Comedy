import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Planet from "@/components/Planet";
import CaptainVideo from "@/components/CaptainVideo";
import SectionTransition from "@/components/home/SectionTransition";
import YoutubeGallery from "@/components/YoutubeGallery";
import AppearancesSection from "@/components/AppearancesSection";
import {
  getActivePartners,
  getActiveShows,
  getPublishedAppearances,
  getReferenceYoutubeVideos,
  getSiteMedia,
} from "@/lib/data";
import { upcomingAppearances } from "@/lib/event-helpers";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

const LOCAL_HERO_VIDEO = "/assets/media/steffen/steffen-stage-loop-hero.mp4";

export const metadata: Metadata = {
  title: "Über Steffen",
  description:
    "Über Steffen Vorholt: Comedian, Moderator und Veranstalter aus Recklinghausen – Host von drei eigenen Comedy-Formaten.",
};

export default async function SteffenPage() {
  const [partners, referenceVideos, shows, heroVideo, appearances] = await Promise.all([
    getActivePartners(),
    getReferenceYoutubeVideos(),
    getActiveShows(),
    getSiteMedia("hero_video"),
    getPublishedAppearances(),
  ]);

  const videoSrc = heroVideo ? mediaUrl(heroVideo) : LOCAL_HERO_VIDEO;
  const steffenAppearances = upcomingAppearances(
    appearances.filter((a) => a.kind !== "show"),
    3,
  );

  return (
    <>
      <header className="steffen-hero">
        <div className="container section steffen-hero-copy">
          <div className="eyebrow">🧑‍🚀 Über mich</div>
          <h1>Steffen Vorholt.</h1>
          <p className="lead">Comedian, Moderator und Veranstalter aus Recklinghausen.</p>
        </div>
        <img
          className="steffen-hero-photo"
          src="/assets/media/steffen/steffen-hero-right.png"
          alt="Steffen Vorholt"
          loading="eager"
          fetchPriority="high"
        />
        <div className="steffen-meteor-divider" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
        </div>
      </header>

      <SectionTransition variant="reveal">
      <section className="container section">
        <div className="feature">
          <div>
            <h2>Der Typ hinter dem Mikro.</h2>
            <p>
              Steffen ist nicht nur Veranstalter eigener Formate, sondern vor allem selbst Comedian –
              unterwegs auf Open Mics, bei Gastauftritten und gemeinsam mit Comedy-Kollegen. Auf der
              Bühne macht er auch dann weiter, wenn das Publikum die Regie übernimmt.
            </p>
            <p>
              Aus Recklinghausen kommend, hat er drei eigene Comedy-Formate aufgebaut und moderiert Events,
              Galas und Firmenfeiern in ganz NRW.
            </p>
            <div className="proof-row">
              <span><b>{shows.length}</b> Eigene Formate</span>
              <span><b>NRW</b> Live unterwegs</span>
              <span><b>Recklinghausen</b> Homebase</span>
            </div>
            <div className="actions">
              <Link className="btn primary" href="/kontakt">Steffen buchen</Link>
              <Link className="btn secondary" href="/shows">Seine Shows</Link>
            </div>
          </div>
          <div className="captain-media is-wide">
            {videoSrc ? <CaptainVideo src={videoSrc} /> : <div className="media-placeholder">Bühnen-Video folgt</div>}
          </div>
        </div>
      </section>
      </SectionTransition>

      <SectionTransition variant="cards">
        <AppearancesSection appearances={steffenAppearances} />
      </SectionTransition>

      {shows.length > 0 && (
        <SectionTransition variant="cards">
        <section className="container section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Seine Formate</div>
              <h2>Eigene Shows.</h2>
            </div>
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
      )}

      {referenceVideos.length > 0 && (
        <SectionTransition variant="archive">
        <section className="container section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Reingucken</div>
              <h2>Video-Referenzen.</h2>
            </div>
            <p>Ausschnitte von der Bühne.</p>
          </div>
          <YoutubeGallery videos={referenceVideos.slice(0, 4)} />
        </section>
        </SectionTransition>
      )}

      {partners.length > 0 && (
        <SectionTransition variant="cards">
        <section className="container section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Zusammenarbeit</div>
              <h2>Partner.</h2>
            </div>
            <p>Veranstalter und Bühnen, mit denen Steffen zusammenarbeitet.</p>
          </div>
          <div className="partner-grid">
            {partners.map((p) => {
              const inner = (
                <>
                  {p.logo_path ? (
                    <Image src={mediaUrl(p.logo_path)} alt={p.name} width={200} height={120} />
                  ) : (
                    <span className="partner-name">{p.name}</span>
                  )}
                  {p.description && <p>{p.description}</p>}
                </>
              );
              return p.url ? (
                <a className="card partner-card" key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              ) : (
                <div className="card partner-card" key={p.id}>{inner}</div>
              );
            })}
          </div>
        </section>
        </SectionTransition>
      )}

      <Footer />
    </>
  );
}
