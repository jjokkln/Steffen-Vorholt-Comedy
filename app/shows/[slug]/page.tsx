import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Calendar from "@/components/Calendar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import ShowGalleries from "@/components/shows/ShowGalleries";
import ShowUpcomingEvents from "@/components/shows/ShowUpcomingEvents";
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
  return { title: show.name, description: show.tagline };
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
  const now = new Date();
  const locationImages = images.filter((i) => i.category === "location");
  const showImages = images.filter((i) => i.category !== "location");
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
            <Link className="btn primary" href="#termine">
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
        <figure className={`show-hero-media${hasHeader ? " has-cover" : ""}`} style={{ color: show.color }}>
          {hasHeader ? (
            <img className="hero-cover" src={headerUrl} alt={show.name} />
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
        <section className="container section show-principle">
          <div className="section-head">
            <div>
              <div className="eyebrow" style={{ color: show.color }}>So läuft die Show</div>
              <h2>Das Show-Prinzip.</h2>
            </div>
            {show.cities_text && (
              <p>
                <strong>Städte &amp; Locations:</strong> {show.cities_text}
              </p>
            )}
          </div>
          <div className="principle-steps">
            {show.principle_items.map((item, i) => (
              <article
                className="principle-step card"
                key={item.title}
                style={{ "--accent": show.color } as CSSProperties}
              >
                <span className="principle-step-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="container section" id="termine">
        <div className="section-head">
          <div>
            <div className="eyebrow" style={{ color: show.color }}>🎟️ Termine</div>
            <h2>Wann läuft {show.name}?</h2>
          </div>
        </div>
        <div className="public-calendar">
          <Calendar events={events} initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} />
        </div>
        <div style={{ marginTop: 28 }}>
          {upcoming.length ? (
            <ShowUpcomingEvents events={upcoming} />
          ) : (
            <div className="grid-3">
              <div className="booking-empty">
                Gerade kein Termin geplant – Steffen schreibt vermutlich neue Witze. Schau im Kalender vorbei!
              </div>
            </div>
          )}
        </div>
      </section>

      {locationImages.length + showImages.length + videos.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Galerie</h2>
            <p>Location, Bühne und Videos aus der Show.</p>
          </div>
          <ShowGalleries
            locationImages={locationImages}
            showImages={showImages}
            videos={videos}
            showName={show.name}
          />
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
