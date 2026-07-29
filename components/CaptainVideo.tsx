"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bühnen-Video neben dem Text (Startseite und „Über Steffen").
 *
 * Vorher stand am Markup fest `preload="metadata"`. Damit hat JEDER Aufruf beider Seiten
 * das Video im Storage angefasst — belegt am 30.07.2026 in den Storage-Logs, wo
 * `hero-…8t4wov.mp4` (6,4 MB) mit Browser-User-Agents aus mehreren Regionen auftauchte.
 * Da beide Seiten über die Fallback-Kette dieselbe Datei zeigen, zählte das doppelt.
 *
 * Jetzt gilt beides: `preload="none"` durchgehend, und die `src` wird erst gesetzt, wenn
 * das Video im Bild ist. Das Standbild kommt aus dem Medien-Platz „Vorschaubild des
 * Bühnen-Videos" — als Bild läuft es über die Next/Vercel-Optimierung und kostet 15 kB
 * statt 6,4 MB.
 *
 * `preload="metadata"` wäre hier eine Falle: Am 30.07.2026 gemessen zieht Chrome damit
 * NICHT nur die Metadaten, sondern die ganze Datei (`readyState` 4, 6405 kB im
 * Netzwerk-Mitschnitt). Ohne Poster war das der Preis dafür, dass überhaupt ein Bild
 * erscheint — mit Poster ist es reine Verschwendung. Also nie wieder einbauen, solange
 * ein Poster hinterlegt ist.
 */
export default function CaptainVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  /** Erst laden, wenn im Bild: setzt `src` nachträglich statt am Markup. */
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Etwas Vorlauf, damit das Video beim Hinscrollen nicht erst schwarz aufblitzt.
      { rootMargin: "200px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    // Klick vor dem Observer (Video steht schon beim Laden im Bild): Quelle sofort
    // nachziehen, sonst hätte `play()` nichts abzuspielen.
    if (!visible) setVisible(true);
    video.play().then(() => setPlaying(true)).catch(() => {});
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void handlePlay();
    else video.pause();
  }

  return (
    <div className="captain-video">
      <video
        ref={videoRef}
        src={visible ? src : undefined}
        poster={poster || undefined}
        playsInline
        preload="none"
        loop
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="captain-video-media"
        onClick={togglePlayback}
      />
      {!playing && (
        <button
          onClick={handlePlay}
          aria-label="Video abspielen"
          className="captain-video-start"
        >
          <span>▶</span>
        </button>
      )}
      <div className="captain-video-controls">
        <button type="button" onClick={togglePlayback} aria-label={playing ? "Video pausieren" : "Video abspielen"}>{playing ? "Ⅱ" : "▶"}</button>
        <button type="button" onClick={() => setMuted((value) => !value)} aria-label={muted ? "Ton einschalten" : "Ton ausschalten"} aria-pressed={muted}>{muted ? "🔇" : "🔊"}</button>
      </div>
    </div>
  );
}
