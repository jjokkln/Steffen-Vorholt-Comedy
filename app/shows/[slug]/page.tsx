import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { getActiveShows, getEventsForShowId, getShowBySlug } from "@/lib/data";
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
  const events = await getEventsForShowId(show.id);
  const { upcoming } = partitionEvents(events);

  return (
    <>
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
        <figure className="show-hero-media">
          {show.planet_image_path && (
            <Image
              src={mediaUrl(show.planet_image_path)}
              alt={`Planet der Show ${show.name}`}
              width={560}
              height={560}
            />
          )}
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
