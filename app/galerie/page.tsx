import type { Metadata } from "next";
import Image from "next/image";
import Footer from "@/components/Footer";
import SocialLinks from "@/components/SocialLinks";
import GalleryFilter from "@/components/GalleryFilter";
import { getActiveComedians, getGalleryItems } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Galerie & Gästebuch",
  description:
    "Fotos von Steffens Shows und Locations – und das Gästebuch der Comedians, die bei ihm auf der Bühne standen.",
};

export default async function GaleriePage() {
  const [gallery, comedians] = await Promise.all([getGalleryItems(), getActiveComedians()]);

  return (
    <>
      <header className="container section">
        <div className="eyebrow">📸 Galerie & Gästebuch</div>
        <h1>Beweisfotos & Bühnen-Gäste.</h1>
        <p className="lead">
          Echte Bühnen, echtes Publikum, echte Lacher – und die Comedians, die bei Steffen zu Gast
          waren.
        </p>
      </header>

      {gallery.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Vergangene Missionen</div>
              <h2>Galerie.</h2>
            </div>
          </div>
          <GalleryFilter items={gallery} />
        </section>
      )}

      {comedians.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Gästebuch</div>
              <h2>Comedians, die bei Steffen waren.</h2>
            </div>
            <p>Klick dich zu ihren Kanälen und Webseiten durch.</p>
          </div>
          <div className="grid-3 comedian-grid">
            {comedians.map((c) => (
              <article className="card comedian-card" key={c.id}>
                {c.photo_path && (
                  <Image
                    className="comedian-photo"
                    src={mediaUrl(c.photo_path)}
                    alt={c.name}
                    width={320}
                    height={320}
                    sizes="(max-width: 900px) 45vw, 320px"
                  />
                )}
                <div className="comedian-body">
                  <h3>{c.name}</h3>
                  {c.age && <p className="comedian-meta">{c.age} Jahre</p>}
                  {c.bio && <p>{c.bio}</p>}
                  <SocialLinks comedian={c} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
