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
  getSiteMediaMap,
} from "@/lib/data";
import { upcomingAppearances } from "@/lib/event-helpers";
import { mediaUrl } from "@/lib/media";
import { resolveSiteMedia } from "@/lib/site-media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Über Steffen",
  description:
    "Über Steffen Vorholt: Comedian, Moderator und Veranstalter aus Recklinghausen – Host von drei eigenen Comedy-Formaten.",
};

export default async function SteffenPage() {
  const [partners, referenceVideos, shows, media, appearances] = await Promise.all([
    getActivePartners(),
    getReferenceYoutubeVideos(),
    getActiveShows(),
    getSiteMediaMap(),
    getPublishedAppearances(),
  ]);

  // Eigener Medien-Platz für diese Seite; solange er leer ist, greift laut Fallback-Kette
  // (lib/site-media.ts) das Video der Startseite — so wie bisher.
  const portraitVideo = resolveSiteMedia(media, "steffen_portrait_video");
  const videoSrc = portraitVideo ? mediaUrl(portraitVideo) : "";
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
          <p className="lead">
            🎤 Comedian &amp; Moderator – ehrlich, schlagfertig und (fast) immer charmant!
          </p>
        </div>
        {/* CSS gibt hier die Höhe vor (min(92%,680px)), die Breite folgt aus dem
            echten Seitenverhältnis 1122×1402. */}
        <Image
          className="steffen-hero-photo"
          src="/assets/media/steffen/steffen-hero-right.png"
          alt="Steffen Vorholt"
          width={1122}
          height={1402}
          sizes="(max-width: 1024px) 60vw, 560px"
          priority
        />
        {/* Kometenbahn als Hero-Abschluss: Horizontlinie + streifende Kometen
            (Tiefenstaffelung über nth-child in globals.css). */}
        <div className="steffen-comet-divider" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      </header>

      <SectionTransition variant="reveal">
      <section className="container section">
        <div className="feature">
          <div>
            <h2>Der Typ hinter dem Mikro.</h2>
            {/* Bio in der Ich-Form (Text von Steffen, 28.07.2026). Aufteilung:
                Einstieg + Haltung hier neben dem Video, die beiden Aufzählungen
                (Lebenslauf / Buchbar für) darunter in .bio-lists – am Stück
                gesetzt würde die linke Spalte doppelt so hoch wie das Video. */}
            <p>
              Hey! Ich bin 31 Jahre jung, humorvoll, sympathisch, ein bisschen tollpatschig –
              und genau das lieben die Leute an mir 😄
            </p>
            <p>
              Ob Stand-Up, Moderation, Hochzeit oder Firmenevent: Ich bringe gute Laune,
              ehrliche Lacher und einen Rucksack voll Geschichten mit. Immer mit einem
              Augenzwinkern, immer authentisch, nie drüber.
            </p>
            <div className="proof-row">
              <span><b>Seit 2019</b> Auf der Bühne</span>
              <span><b>{shows.length}</b> Eigene Formate</span>
              <span><b>Recklinghausen</b> Homebase</span>
            </div>
            <div className="actions">
              <Link className="btn primary" href="/kontakt">Steffen buchen</Link>
              <Link className="btn secondary" href="/shows">Meine Shows</Link>
            </div>
          </div>
          <div className="captain-media is-wide">
            {videoSrc ? <CaptainVideo src={videoSrc} /> : <div className="media-placeholder">Bühnen-Video folgt</div>}
          </div>
        </div>

        <div className="grid-2 bio-lists">
          <article className="card">
            <h3>Seit 2019 auf den Bühnen Deutschlands.</h3>
            <p>Da erzähle ich von meinem chaotischen Leben:</p>
            <ul className="list">
              <li>
                <span className="emoji" aria-hidden="true">🚗</span>
                <span>Ausbildung zum <b>Kfz-Mechatroniker</b></span>
              </li>
              <li>
                <span className="emoji" aria-hidden="true">🚑</span>
                <span>Einsätze im <b>Rettungsdienst</b></span>
              </li>
              <li>
                <span className="emoji" aria-hidden="true">💔</span>
                <span>
                  Das Leben als <b>ewiger Single</b> – bis ich eine Freundin fand,
                  die meine Gags über sie duldet
                </span>
              </li>
              <li>
                <span className="emoji" aria-hidden="true">🍻</span>
                <span>Und natürlich meine <b>legendären Feiereskapaden</b> in der Jugend!</span>
              </li>
            </ul>
          </article>

          <article className="card">
            <h3>Buchbar für deinen Anlass.</h3>
            <p>📌 Hier bin ich richtig:</p>
            <ul className="list">
              <li>
                <span className="emoji" aria-hidden="true">✅</span>
                <span><b>Comedyshows</b></span>
              </li>
              <li>
                <span className="emoji" aria-hidden="true">✅</span>
                <span><b>Hochzeiten &amp; Geburtstage</b></span>
              </li>
              <li>
                <span className="emoji" aria-hidden="true">✅</span>
                <span><b>Firmenfeiern &amp; besondere Events</b></span>
              </li>
            </ul>
            <p className="bio-card-foot">
              💬 Lass uns zusammen eine Show auf die Beine stellen, bei der die Bauchmuskeln
              mehr zu tun haben als das Catering-Team! 😄
            </p>
            <div className="actions">
              <Link className="btn primary" href="/kontakt">Anfrage schicken</Link>
            </div>
          </article>
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
              <div className="eyebrow">Meine Formate</div>
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
            <p>Veranstalter und Bühnen, mit denen ich zusammenarbeite.</p>
          </div>
          <div className="partner-grid">
            {partners.map((p) => {
              const inner = (
                <>
                  {p.logo_path ? (
                    <Image
                      src={mediaUrl(p.logo_path)}
                      alt={p.name}
                      width={200}
                      height={120}
                      sizes="200px"
                    />
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
