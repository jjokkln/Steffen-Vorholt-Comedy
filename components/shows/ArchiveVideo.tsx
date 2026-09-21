"use client";

import { useState } from "react";
import VideoThumb from "@/components/shows/VideoThumb";
import { mediaUrl, optimizedImageUrl } from "@/lib/media";
import type { ShowVideo } from "@/lib/types";

/**
 * Eine Kachel im Archiv („Videos vom Ersteller") auf /shows. Anders als in den
 * Galerien der Show-Seiten gibt es hier keine Lightbox — das Video läuft in der
 * Kachel selbst.
 *
 * Vorher stand hier direkt ein `<video controls preload="none">`. Das hatte zwei
 * Fehler auf einmal: Ohne Vorschaubild blieb die Kachel schwarz (siehe VideoThumb),
 * und das Hochformat wurde ignoriert — die Klasse `.portrait` am `<figure>` hatte
 * überhaupt keine CSS-Regel, sodass ein 1080×1920-Video in einer 302 × 340 großen
 * Fläche lag. Jetzt trägt der Platzhalter das Format, und das `<video>` entsteht
 * erst beim Klick: kein Storage-Egress, solange niemand schaut.
 */
export default function ArchiveVideo({ video }: { video: ShowVideo }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <video
        src={mediaUrl(video.video_path)}
        poster={video.poster_path ? optimizedImageUrl(video.poster_path, 640) : undefined}
        controls
        autoPlay
        playsInline
        data-orientation={video.orientation ?? "landscape"}
      />
    );
  }

  return (
    <button
      type="button"
      className="archive-video-start"
      onClick={() => setPlaying(true)}
      aria-label={video.title ? `Video abspielen: ${video.title}` : "Video abspielen"}
    >
      <VideoThumb
        videoPath={video.video_path}
        posterPath={video.poster_path}
        orientation={video.orientation ?? "landscape"}
      />
    </button>
  );
}
