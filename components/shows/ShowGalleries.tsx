"use client";

import { useState } from "react";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import StorageImage from "@/components/media/StorageImage";
import { mediaUrl, optimizedImageUrl } from "@/lib/media";
import type { ShowImage, ShowVideo } from "@/lib/types";

/** Kacheln sind rund 340 px hoch, in der Breite selten über 520 px. */
const TILE_SIZES = "(max-width: 720px) 90vw, 520px";

/**
 * Drei getrennte Galerie-Ansichten auf der Show-Subpage: Location-Bilder,
 * Show-Bilder und Videos. Alle teilen sich EIN Lightbox-Array (durchgehende
 * Navigation), die Abschnitte dienen nur der optischen Gruppierung.
 */
export default function ShowGalleries({
  locationImages,
  showImages,
  videos,
  showName,
}: {
  locationImages: ShowImage[];
  showImages: ShowImage[];
  videos: ShowVideo[];
  showName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (locationImages.length + showImages.length + videos.length === 0) return null;

  const lightboxItems: LightboxItem[] = [
    ...locationImages.map((img) => ({
      type: "image" as const,
      path: img.image_path,
      alt: img.alt_text || showName,
      caption: img.alt_text,
    })),
    ...showImages.map((img) => ({
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

  const locOffset = 0;
  const showOffset = locationImages.length;
  const videoOffset = locationImages.length + showImages.length;

  return (
    <>
      {locationImages.length > 0 && (
        <div className="show-gallery-block">
          <h3 className="show-gallery-title">Location</h3>
          <div className="show-media-grid">
            {locationImages.map((img, i) => (
              <figure key={img.id} className="show-media-item" onClick={() => setOpenIndex(locOffset + i)}>
                <StorageImage path={img.image_path} alt={img.alt_text || showName} sizes={TILE_SIZES} />
                {img.alt_text && <figcaption>{img.alt_text}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}

      {showImages.length > 0 && (
        <div className="show-gallery-block">
          <h3 className="show-gallery-title">Show</h3>
          <div className="show-media-grid">
            {showImages.map((img, i) => (
              <figure key={img.id} className="show-media-item" onClick={() => setOpenIndex(showOffset + i)}>
                <StorageImage path={img.image_path} alt={img.alt_text || showName} sizes={TILE_SIZES} />
                {img.alt_text && <figcaption>{img.alt_text}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div className="show-gallery-block">
          <h3 className="show-gallery-title">Videos</h3>
          <div className="show-media-grid">
            {videos.map((v, i) => (
              <figure key={v.id} className="show-media-item" onClick={() => setOpenIndex(videoOffset + i)}>
                <div className="media-thumb">
                  {/* preload="none" ohne Ausnahme — Begründung in ShowMediaGallery.tsx:
                      "metadata" war für Videos OHNE Poster gedacht, kostet dort aber am
                      meisten (das 16-MB-Video von „Comedy Eiskalt" hat keins). Die
                      Play-Plakette darüber zeigt, dass da ein Video liegt. */}
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
        </div>
      )}

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
