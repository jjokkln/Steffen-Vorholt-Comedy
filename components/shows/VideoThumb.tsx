import { mediaUrl, optimizedImageUrl } from "@/lib/media";
import type { VideoOrientation } from "@/lib/types";

/**
 * Die Kachel eines Videos, bevor jemand darauf drückt — für alle drei Galerien
 * (Show-Seite, kombinierte Mediengalerie, Archiv auf /shows).
 *
 * Warum es diese Komponente gibt: Alle Kacheln laden mit `preload="none"` (Egress,
 * siehe context/troubleshooting.md). Ein `<video>` ohne `poster` hat damit nichts
 * anzuzeigen und wird zu einer schwarzen Fläche auf dunklem Grund — auf der Show-Seite
 * verriet nur die Play-Plakette, dass da überhaupt etwas liegt, im Archiv auf /shows
 * nicht einmal das. Am 16.09.2026 stand dort ein Video ohne Vorschaubild, und es war
 * auf Desktop und iPad schlicht nicht zu sehen (gemessen: 302 × 340 px schwarz).
 *
 * Deshalb: Ohne Vorschaubild wird gar kein `<video>` gerendert, sondern ein sichtbarer
 * Platzhalter mit Play-Plakette. Der kostet null Egress und sieht in jedem Browser
 * gleich aus — auch in denen, die sich (anders als Safari auf iOS) an `preload="none"`
 * halten. Neue Uploads erzeugen ihr Standbild inzwischen selbst
 * (lib/video-poster.ts), der Platzhalter ist also der Fall „Altbestand".
 */
export default function VideoThumb({
  videoPath,
  posterPath,
  orientation = "landscape",
}: {
  videoPath: string;
  posterPath: string;
  orientation?: VideoOrientation;
}) {
  return (
    <div className="media-thumb">
      {posterPath ? (
        <video
          src={mediaUrl(videoPath)}
          poster={optimizedImageUrl(posterPath, 640)}
          preload="none"
          muted
          playsInline
        />
      ) : (
        // Ohne Beschriftung: Den Titel trägt die `<figcaption>` der Kachel, im
        // Platzhalter stünde er ein zweites Mal.
        <div className="media-thumb-empty" data-orientation={orientation} />
      )}
      <span className="media-play-badge" aria-hidden="true">
        <span>▶</span>
      </span>
    </div>
  );
}
