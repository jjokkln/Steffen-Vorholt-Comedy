"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type TransitionVariant = "cards" | "track" | "archive" | "reveal";

const SELECTORS: Record<TransitionVariant, string> = {
  cards: ".section-head, .card, .show-card, [data-st-item]",
  track: ".section-head, .event-card, .actions, [data-st-item]",
  archive: ".section-head, .gallery-grid figure, .youtube-item, [data-st-item]",
  reveal: ".section-head, .feature > *, .buzzer-zone, [data-st-item]",
};

export default function SectionTransition({
  variant,
  children,
  className = "",
}: {
  variant: TransitionVariant;
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const media = gsap.matchMedia();

      // Statisch (kein Entrance-Transform) bei Reduced-Motion UND auf Mobile:
      // Auf schmalen Viewports „hing" die from()-Tween teils in ihrem Start-
      // zustand (translateY 86px), sodass die Karten sichtbar, aber um 86px nach
      // unten versetzt standen → große Lücke zur Kopfzeile. Auf Mobile daher
      // Karten direkt an ihrer Position rendern.
      media.add("(prefers-reduced-motion: reduce), (max-width: 820px)", () => {
        gsap.set(SELECTORS[variant], { clearProps: "all" });
        gsap.set(".section-light-track", { scaleX: 1, opacity: 0.45 });
      });

      media.add("(prefers-reduced-motion: no-preference) and (min-width: 821px)", () => {
        const items = gsap.utils.toArray<HTMLElement>(SELECTORS[variant], root);

        // Manche Item-Klassen haben eine eigene CSS-`transition` auf `transform`
        // fürs Hover-Tilt (z. B. .show-card, .gallery-grid figure). Die kollidiert
        // mit GSAPs Frame-für-Frame-Inline-Writes hier: der Browser versucht,
        // jeden GSAP-Tick zusätzlich per CSS zu glätten, wodurch die Karte nie
        // ihre Zielposition erreicht und dauerhaft im Start-Zustand (z. B.
        // translateY 86px) hängen bleibt. Für die Dauer des Reveals deaktivieren,
        // danach wieder freigeben, damit die Hover-Effekte normal weiterlaufen.
        gsap.set(items, { transition: "none" });
        const restoreTransition = () => gsap.set(items, { clearProps: "transition" });

        const base = {
          autoAlpha: 0,
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.1,
          onComplete: restoreTransition,
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        };

        if (variant === "cards") {
          gsap.from(items, { ...base, y: 86, scale: 0.92, rotateX: -7 });
        } else if (variant === "archive") {
          gsap.from(items, { ...base, y: 58, scale: 0.9, rotation: 3 });
        } else {
          gsap.from(items, { ...base, y: 42 });
        }

        if (variant === "track") {
          gsap.fromTo(
            ".section-light-track",
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1,
              opacity: 0.62,
              duration: 1.25,
              ease: "power2.out",
              scrollTrigger: { trigger: root, start: "top 80%" },
            },
          );
        }
      });

      return () => media.revert();
    },
    { scope: rootRef, dependencies: [variant], revertOnUpdate: true },
  );

  return (
    <div className={`section-transition is-${variant} ${className}`.trim()} ref={rootRef}>
      {variant === "track" && <span className="section-light-track" aria-hidden="true" />}
      {children}
    </div>
  );
}
