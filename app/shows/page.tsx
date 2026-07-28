import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import YoutubeGallery from "@/components/YoutubeGallery";
import JsonLd from "@/components/JsonLd";
import TermineSection from "@/components/shows/TermineSection";
import {
  getActiveShows,
  getAllShowVideos,
  getPublishedEvents,
  getReferenceYoutubeVideos,
} from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";
import { comedyEventJsonLd, eventToJsonLdInput } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shows & Termine",
  description:
    "Alle Comedy-Formate von Steffen Vorholt mit Terminen als Kalender und Karte – Tickets direkt beim Anbieter.",
};

export default async function ShowsPage() {
  const [shows, events, creatorVideos, referenceVideos] = await Promise.all([
    getActiveShows(),
    getPublishedEvents(),
    getAllShowVideos(),
    getReferenceYoutubeVideos(),
  ]);
  const { upcoming } = partitionEvents(events);
  const now = new Date();
  const hasArchive = creatorVideos.length > 0 || referenceVideos.length > 0;

  return (
    <>
      <header className="container section">
        <div className="eyebrow">🪐 Wähle deine Mission</div>
        <h1>Finde die Show, die zu deinem Humor passt.</h1>
        <p className="lead">
          Mit Doppel-Comedy, Brain Loading &amp; Comedy Eiskalt ist für jeden Humor etwas dabei 😉
        </p>
        <p className="lead shows-lead-kicker">Schau dir die Shows einfach in Ruhe mal an.</p>
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
                  {show.planet_image_path && (
                    <Image
                      src={mediaUrl(show.planet_image_path)}
                      alt={`Planet der Show ${show.name}`}
                      width={300}
                      height={300}
                      sizes="(max-width: 900px) 45vw, 300px"
                    />
                  )}
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
                <Link className="btn secondary" href="/shows#termine">
                  Tickets
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container section">
        <Suspense fallback={null}>
          <TermineSection
            events={events}
            upcoming={upcoming}
            shows={shows}
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth() + 1}
          />
        </Suspense>
      </section>

      {hasArchive && (
        <section className="container section show-archive">
          {/* Eyebrow + Headline gehören in EINEN Wrapper – .section-head ist
              space-between, ohne Wrapper wird die Headline an den rechten Rand
              gedrückt (war der „komisch rechts“-Bug, 28.07.2026). */}
          <div className="section-head">
            <div>
              <div className="eyebrow">📼 Archiv</div>
              <h2>Zum Nachschauen.</h2>
            </div>
          </div>

          {creatorVideos.length > 0 && (
            <div className="archive-block">
              <h3>Videos vom Ersteller</h3>
              <div className="show-media-grid" data-count={String(Math.min(creatorVideos.length, 4))}>
                {creatorVideos.map((v) => (
                  <figure
                    key={v.id}
                    className={`show-media-item${v.orientation === "portrait" ? " portrait" : ""}`}
                  >
                    {/* Mit Poster lädt der Browser die Videodatei erst auf Klick. */}
                    <video
                      src={mediaUrl(v.video_path)}
                      poster={v.poster_path ? mediaUrl(v.poster_path) : undefined}
                      controls
                      preload={v.poster_path ? "none" : "metadata"}
                      playsInline
                    />
                    {v.title && <figcaption>{v.title}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {referenceVideos.length > 0 && (
            <div className="archive-block">
              <h3>YouTube-Referenzen</h3>
              <YoutubeGallery videos={referenceVideos} />
            </div>
          )}
        </section>
      )}

      <JsonLd data={upcoming.map((e) => comedyEventJsonLd(eventToJsonLdInput(e)))} />
      <Footer />
    </>
  );
}
