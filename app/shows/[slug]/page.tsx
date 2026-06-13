import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getActiveShows, getEventsForShowId, getImagesForShowId, getShowBySlug, getVideosForShowId } from "@/lib/data";
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
  const [events, videos, images] = await Promise.all([
    getEventsForShowId(show.id),
    getVideosForShowId(show.id),
    getImagesForShowId(show.id),
  ]);
  const { upcoming } = partitionEvents(events);
  const backgroundUrl = show.background_image_path ? mediaUrl(show.background_image_path) : "";
  const headerUrl = show.header_image_path ? mediaUrl(show.header_image_path) : "";
  const hasHeader = !!headerUrl;

  // Kombiniere Fotos + Videos für adaptive Galerie (Fotos zuerst)
  const totalMedia = images.length + videos.length;

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
            <Link className="btn primary" href="/termine">
              🎟 Termine &amp; Tickets
            </Link>
            <Link className="btn secondary" href="/kontakt#bewerben">
              Als Comedian bewerben
            </Link>
          </div>
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

      {totalMedia > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Medien</h2>
            <p>Fotos und Videos aus der Show.</p>
          </div>
          <div
            className="show-media-grid"
            data-count={String(Math.min(totalMedia, 4))}
          >
            {images.map((img) => (
              <figure key={img.id} className="show-media-item">
                <img
                  src={mediaUrl(img.image_path)}
                  alt={img.alt_text || show.name}
                  loading="lazy"
                />
                {img.alt_text && <figcaption>{img.alt_text}</figcaption>}
              </figure>
            ))}
            {videos.map((v) => (
              <figure key={v.id} className={`show-media-item${v.orientation === "portrait" ? " portrait" : ""}`}>
                <video
                  src={mediaUrl(v.video_path)}
                  poster={v.poster_path ? mediaUrl(v.poster_path) : undefined}
                  controls
                  preload="metadata"
                  playsInline
                />
                {v.title && <figcaption>{v.title}</figcaption>}
              </figure>
            ))}
          </div>
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
