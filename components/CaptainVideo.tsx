"use client";

import { useRef, useState } from "react";

export default function CaptainVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function handlePlay() {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setPlaying(true)).catch(() => {});
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
      />
      {!playing && (
        <button
          onClick={handlePlay}
          aria-label="Video abspielen"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(5,7,17,.42)",
            border: 0,
            cursor: "pointer",
            borderRadius: "inherit",
          }}
        >
          <span style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(255,255,255,.15)",
            border: "2px solid rgba(255,255,255,.55)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            color: "#fff",
            transition: "transform .18s ease, background .18s ease",
          }}>
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
