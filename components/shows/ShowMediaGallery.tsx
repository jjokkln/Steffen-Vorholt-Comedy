"use client";

import { useState } from "react";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import StorageImage from "@/components/media/StorageImage";
import { mediaUrl, optimizedImageUrl } from "@/lib/media";
import type { ShowImage, ShowVideo } from "@/lib/types";

/** Kacheln sind rund 340 px hoch, in der Breite selten über 520 px. */
const TILE_SIZES = "(max-width: 720px) 90vw, 520px";

export default function ShowMediaGallery({
  images,
  videos,
  showName,
}: {
  images: ShowImage[];
  videos: ShowVideo[];
  showName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length + videos.length === 0) return null;

  const lightboxItems: LightboxItem[] = [
    ...images.map((img) => ({
      type: "image" as const,
      path: img.image_path,
      alt: img.alt_text || showName,
      caption: img.alt_text,
    })),
    ...videos.map((v) => ({
      type: "video" as const,
      src: mediaUrl(v.video_path),
      poster: v.poster_path ? mediaUrl(v.poster_path) : undefined,
      caption: v.title,
    })),
  ];

  return (
    <>
      <div className="show-media-grid">
        {images.map((img, i) => (
          <figure key={img.id} className="show-media-item" onClick={() => setOpenIndex(i)}>
            <StorageImage path={img.image_path} alt={img.alt_text || showName} sizes={TILE_SIZES} />
            {img.alt_text && <figcaption>{img.alt_text}</figcaption>}
          </figure>
        ))}
        {videos.map((v, i) => (
          <figure
            key={v.id}
            className="show-media-item"
            onClick={() => setOpenIndex(images.length + i)}
          >
            <div className="media-thumb">
              {/* preload="none" ohne Ausnahme: "metadata" war für Videos OHNE Poster gedacht,
                  kostet dort aber am meisten. Belegt am 30.07.2026 — das Video von
                  „Comedy Eiskalt" hat kein Poster und ist 16 MB groß, jeder Aufruf der
                  Show-Seite fasste es an. Die Play-Plakette darüber zeigt, dass da ein
                  Video liegt; geladen wird erst beim Klick. */}
              <video
                src={mediaUrl(v.video_path)}
                poster={v.poster_path ? optimizedImageUrl(v.poster_path, 640) : undefined}
                preload="none"
                muted
                playsInline
              />
              <span className="media-play-badge" aria-hidden="true">
                <span>▶</span>
              </span>
            </div>
            {v.title && <figcaption>{v.title}</figcaption>}
          </figure>
        ))}
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
