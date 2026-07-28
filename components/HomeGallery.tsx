"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/types";

export default function HomeGallery({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  const lightboxItems: LightboxItem[] = items.map((item) => ({
    type: "image",
    path: item.image_path,
    alt: item.caption || "Showfoto",
    caption: item.caption,
  }));

  // Aktiven Slide anhand der Scroll-Position im Karussell (nur mobil sichtbar) tracken.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = slideRefs.current.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        });
      },
      { root: track, threshold: 0.6 },
    );
    slideRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  const scrollToIndex = (idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    slideRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  return (
    <>
      <div className="home-gallery">
        <div className="gallery-grid" ref={trackRef}>
          {items.map((item, index) => (
            <figure
              key={item.id}
              ref={(el) => {
                slideRefs.current[index] = el;
              }}
              style={{ "--rot": `${(index % 3) - 1}deg` } as CSSProperties}
              onClick={() => setOpenIndex(index)}
            >
              {/* Kachel ist 260 px hoch, also ~350 px breit; mobil ein Slide über die
                  volle Breite. Ohne `sizes` würde next/image 100vw annehmen und die
                  1920-px-Variante ausliefern. */}
              <Image
                src={mediaUrl(item.image_path)}
                alt={item.caption || "Showfoto"}
                width={800}
                height={600}
                sizes="(max-width: 720px) 100vw, 350px"
              />
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
        </div>

        {items.length > 1 && (
          <div className="gallery-slideshow-controls" aria-hidden="true">
            <button
              type="button"
              className="gallery-nav prev"
              aria-label="Vorheriges Foto"
              disabled={active === 0}
              onClick={() => scrollToIndex(active - 1)}
            >
              ‹
            </button>
            <div className="gallery-dots">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={index === active ? "is-active" : ""}
                  aria-label={`Foto ${index + 1}`}
                  onClick={() => scrollToIndex(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="gallery-nav next"
              aria-label="Nächstes Foto"
              disabled={active === items.length - 1}
              onClick={() => scrollToIndex(active + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>

      {openIndex !== null && (
        <Lightbox
          items={lightboxItems}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}
