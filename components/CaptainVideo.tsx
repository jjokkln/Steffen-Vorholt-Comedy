"use client";

import { useRef, useState } from "react";

export default function CaptainVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
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
        src={src}
        playsInline
        preload="metadata"
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
