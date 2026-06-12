"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

export default function Buzzer({ oneLiners }: { oneLiners: string[] }) {
  const [line, setLine] = useState<string | null>(null);

  const fire = () => {
    if (oneLiners.length) {
      setLine(oneLiners[Math.floor(Math.random() * oneLiners.length)]);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.7 },
        colors: ["#7CFF6B", "#42D9FF", "#FF4FD8", "#f5d68a"],
      });
    }
  };

  return (
    <div className="buzzer-zone">
      <button type="button" className="buzzer" onClick={fire} aria-label="Buzzer drücken">
        BUZZ
      </button>
      <p className="buzzer-line" aria-live="polite">
        {line ?? "Drück den Buzzer. Trau dich."}
      </p>
    </div>
  );
}
