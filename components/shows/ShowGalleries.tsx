"use client";

import { useState } from "react";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import { mediaUrl } from "@/lib/media";
import type { ShowImage, ShowVideo } from "@/lib/types";

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
      src: mediaUrl(img.image_path),
      alt: img.alt_text || showName,
      caption: img.alt_text,
    })),
    ...showImages.map((img) => ({
      type: "image" as const,
      src: mediaUrl(img.image_path),
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
                <img src={mediaUrl(img.image_path)} alt={img.alt_text || showName} loading="lazy" />
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
                <img src={mediaUrl(img.image_path)} alt={img.alt_text || showName} loading="lazy" />
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
                  <video
                    src={mediaUrl(v.video_path)}
                    poster={v.poster_path ? mediaUrl(v.poster_path) : undefined}
                    preload="metadata"
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
