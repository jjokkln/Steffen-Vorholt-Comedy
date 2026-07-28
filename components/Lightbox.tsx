"use client";

import { useCallback, useEffect } from "react";
import StorageImage from "@/components/media/StorageImage";

/**
 * Bilder tragen den Storage-Pfad (nicht die fertige URL), damit die Lightbox sie
 * über die Bild-Optimierung laden kann. Vorher lief hier das unbearbeitete
 * Original über die Leitung — bei den Show-Bildern bis zu 7 MB pro Klick.
 */
export type LightboxItem =
  | { type: "image"; path: string; alt?: string; caption?: string }
  | { type: "video"; src: string; poster?: string; caption?: string };

export default function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const count = items.length;
  const goPrev = useCallback(() => onIndexChange((index - 1 + count) % count), [index, count, onIndexChange]);
  const goNext = useCallback(() => onIndexChange((index + 1) % count), [index, count, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && count > 1) goPrev();
      if (e.key === "ArrowRight" && count > 1) goNext();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, goPrev, goNext, count]);

  const item = items[index];
  if (!item) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Schließen">
        ✕
      </button>
      {count > 1 && (
        <button
          className="lightbox-nav prev"
          aria-label="Vorheriges Medium"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          ‹
        </button>
      )}
      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        {item.type === "image" ? (
          <StorageImage
            className="lightbox-image"
            path={item.path}
            alt={item.alt || ""}
            sizes="(max-width: 1200px) 92vw, 1100px"
            priority
          />
        ) : (
          <video src={item.src} poster={item.poster} controls autoPlay playsInline />
        )}
        {item.caption && <p className="lightbox-caption">{item.caption}</p>}
      </div>
      {count > 1 && (
        <button
          className="lightbox-nav next"
          aria-label="Nächstes Medium"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
