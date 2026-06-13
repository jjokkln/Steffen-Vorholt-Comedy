"use client";

import { useRef, useState } from "react";
import confetti from "canvas-confetti";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function Buzzer({ oneLiners }: { oneLiners: string[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<string | null>(null);
  const { contextSafe } = useGSAP({ scope: rootRef });

  const fire = contextSafe(() => {
    if (oneLiners.length) {
      setLine(oneLiners[Math.floor(Math.random() * oneLiners.length)]);
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.7 },
      colors: ["#7CFF6B", "#42D9FF", "#FF4FD8", "#f5d68a"],
    });

    gsap
      .timeline()
      .fromTo(
        ".buzzer-energy",
        { scale: 0.45, autoAlpha: 0.9 },
        { scale: 1.65, autoAlpha: 0, duration: 0.58, ease: "power2.out" },
      )
      .to(rootRef.current, {
        keyframes: { x: [-5, 5, -3, 3, 0], rotation: [-0.4, 0.4, -0.2, 0.2, 0] },
        duration: 0.28,
        ease: "none",
      }, 0)
      .fromTo(".buzzer", { scale: 0.94 }, { scale: 1.05, duration: 0.16, yoyo: true, repeat: 1 }, 0);
  });

  return (
    <div className="buzzer-zone" ref={rootRef}>
      <div className="buzzer-target">
        <span className="buzzer-energy" aria-hidden="true" />
        <button type="button" className="buzzer" onClick={fire} aria-label="Buzzer drücken">
          BUZZ
        </button>
      </div>
      <p className="buzzer-line" aria-live="polite">
        {line ?? "Drück den Buzzer. Trau dich."}
      </p>
    </div>
  );
}
