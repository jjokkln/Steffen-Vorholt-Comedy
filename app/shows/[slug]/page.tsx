import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ShowMediaGallery from "@/components/shows/ShowMediaGallery";
import SocialLinks from "@/components/SocialLinks";
import YoutubeGallery from "@/components/YoutubeGallery";
import {
  getActiveShows,
  getComediansForShowId,
  getEventsForShowId,
  getImagesForShowId,
  getShowBySlug,
  getVideosForShowId,
  getYoutubeVideosForShowId,
} from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";
import { breadcrumbJsonLd, comedyEventJsonLd, eventToJsonLdInput } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const shows = await getActiveShows();
  return shows.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) return {};
  return { title: `${show.name} – Steffen Vorholt`, description: show.tagline };
}

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) notFound();
  const [events, videos, images, participants, youtubeVideos] = await Promise.all([
    getEventsForShowId(show.id),
    getVideosForShowId(show.id),
    getImagesForShowId(show.id),
    getComediansForShowId(show.id),
    getYoutubeVideosForShowId(show.id),
  ]);
  const { upcoming } = partitionEvents(events);
  const backgroundUrl = show.background_image_path ? mediaUrl(show.background_image_path) : "";
  const headerUrl = show.header_image_path ? mediaUrl(show.header_image_path) : "";
  const hasHeader = !!headerUrl;

  return (
    <>
      {backgroundUrl && (
        <div
          className="show-page-bg"
          aria-hidden="true"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      )}
      <header className="container section hero">
        <div>
          <div className="eyebrow">
            <span className="dot" style={{ background: show.color, boxShadow: `0 0 24px ${show.color}` }}></span>{" "}
            {show.name} · {show.format_label}
          </div>
          <h1>{show.tagline}</h1>
          <p className="lead">{show.description}</p>
          <div className="actions">
            <Link className="btn primary" href="/shows#termine">
              🎟 Termine &amp; Tickets
            </Link>
            <Link className="btn secondary" href="/kontakt#booking-show">
              Diese Show buchen
            </Link>
          </div>
          {show.hint_text && (
            <p className="show-hint" style={{ borderColor: show.color }}>
              🎟️ {show.hint_text}
            </p>
          )}
        </div>
        <figure className={`show-hero-media${hasHeader ? " has-cover" : ""}`} style={hasHeader ? { color: show.color } : { color: show.color }}>
          {hasHeader ? (
            <>
              <img className="hero-cover" src={headerUrl} alt={show.name} />
              {show.planet_image_path && (
                <Image
                  className="hero-planet"
                  src={mediaUrl(show.planet_image_path)}
                  alt=""
                  width={140}
                  height={140}
                />
              )}
            </>
          ) : show.planet_image_path ? (
            <Image
              src={mediaUrl(show.planet_image_path)}
              alt={`Planet der Show ${show.name}`}
              width={560}
              height={560}
            />
          ) : null}
        </figure>
      </header>

      {show.principle_items.length > 0 && (
        <section className="container section">
          <div className="grid-2">
            <div className="card">
              <h3>Show-Prinzip</h3>
              <ul className="list">
                {show.principle_items.map((item) => (
                  <li key={item.title}>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Städte &amp; Locations</h3>
              <p>{show.cities_text}</p>
            </div>
          </div>
        </section>
      )}

      {images.length + videos.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Medien</h2>
            <p>Fotos und Videos aus der Show.</p>
          </div>
          <ShowMediaGallery images={images} videos={videos} showName={show.name} />
        </section>
      )}

      {participants.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Mit dabei</h2>
            <p>Comedians &amp; Teilnehmer dieser Show.</p>
          </div>
          <div className="grid-3 comedian-grid">
            {participants.map((sc) => {
              const c = sc.comedians!;
              return (
                <article className="card comedian-card" key={sc.id}>
                  {c.photo_path && (
                    <Image
                      className="comedian-photo"
                      src={mediaUrl(c.photo_path)}
                      alt={c.name}
                      width={320}
                      height={320}
                    />
                  )}
                  <div className="comedian-body">
                    <h3>{c.name}</h3>
                    {(sc.role || c.age) && (
                      <p className="comedian-meta">
                        {[sc.role, c.age ? `${c.age} Jahre` : ""].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {c.bio && <p>{c.bio}</p>}
                    <SocialLinks comedian={c} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {youtubeVideos.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Videos</h2>
            <p>Ausschnitte dieser Show auf YouTube.</p>
          </div>
          <YoutubeGallery videos={youtubeVideos} />
        </section>
      )}

      <section className="container section">
        <div className="section-head">
          <h2>Kommende {show.name}-Termine</h2>
          <p>Alle Termine inkl. anderer Shows findest du im Kalender.</p>
        </div>
        <div className="grid-3">
          {upcoming.length ? (
            upcoming.map((e) => <EventCard key={e.id} event={e} />)
          ) : (
            <div className="booking-empty">
              Gerade kein Termin geplant – Steffen schreibt vermutlich neue Witze. Schau im Kalender vorbei!
            </div>
          )}
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Shows", path: "/shows" },
            { name: show.name, path: `/shows/${show.slug}` },
          ]),
          ...upcoming.map((e) => comedyEventJsonLd(eventToJsonLdInput(e))),
        ]}
      />
      <Footer />
    </>
  );
}
