"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/assets/media/steffen/steffen-trailer.mp4";
const POSTER = "/assets/media/steffen/steffen-trailer-poster.webp";

/**
 * Vollflächiger Trailer direkt unter dem Hero. Liegt im `.hero-pin-block` und
 * schiebt sich beim Scrollen über den gepinnten Hero — dieselbe Mechanik, die
 * vorher „Wähl deine Mission" hatte (negativer margin-top + z-index, siehe
 * .hero-trailer in globals.css).
 *
 * Startet stumm (alles andere blockieren Browser beim Autoplay) und erst, wenn
 * das Video wirklich im Bild ist: die Datei ist 6,5 MB groß, ein `autoPlay` am
 * Markup würde sie bei JEDEM Startseiten-Aufruf ziehen, auch wenn niemand so
 * weit scrollt. Deshalb `preload="none"` + IntersectionObserver.
 */
export default function HeroTrailer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Hat der Besucher selbst pausiert? Dann darf der Observer nicht wieder
  // anwerfen, sobald das Video erneut ins Bild scrollt.
  const pausedByUser = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Reduced Motion: nichts von allein starten. Der Play-Button bleibt.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.35) {
          if (!pausedByUser.current) void video.play().catch(() => {});
        } else if (entry.intersectionRatio === 0) {
          // Erst pausieren, wenn das Video komplett aus dem Bild ist – sonst
          // stoppt es bei jedem kleinen Scroll-Ruckler, und mit Ton wäre das
          // ein Aussetzer mitten im Satz.
          video.pause();
        }
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      pausedByUser.current = false;
      void video.play().catch(() => {});
    } else {
      pausedByUser.current = true;
      video.pause();
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    setMuted(next);
    video.muted = next;
    // Ton anschalten heißt: der Besucher will das Video sehen. Falls es gerade
    // steht (Reduced Motion, vorher pausiert), hier direkt mitstarten.
    if (!next && video.paused) {
      pausedByUser.current = false;
      void video.play().catch(() => {});
    }
  }

  return (
    <div className="hero-trailer">
      <video
        ref={videoRef}
        className="hero-trailer-media"
        src={SRC}
        poster={POSTER}
        preload="none"
        loop
        muted
        playsInline
        onClick={togglePlayback}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="hero-trailer-controls">
        <button
          type="button"
          className="hero-trailer-btn"
          onClick={togglePlayback}
          aria-label={playing ? "Trailer pausieren" : "Trailer abspielen"}
        >
          <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
        </button>
        {/* Bewusst mit Text statt nur Lautsprecher-Symbol: ein stummes
            Vollbild-Video, dessen Ton man einschalten KANN, muss man auch
            finden. */}
        <button
          type="button"
          className="hero-trailer-btn is-sound"
          onClick={toggleSound}
          aria-pressed={!muted}
        >
          <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
          {muted ? "Ton an" : "Ton aus"}
        </button>
      </div>
    </div>
  );
}
