"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type TransitionVariant = "cards" | "track" | "archive" | "reveal";

const SELECTORS: Record<TransitionVariant, string> = {
  cards: ".section-head, .show-card",
  track: ".section-head, .event-card, .actions",
  archive: ".section-head, .gallery-grid figure",
  reveal: ".section-head, .feature > *, .buzzer-zone",
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

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(SELECTORS[variant], { clearProps: "all" });
        gsap.set(".section-light-track", { scaleX: 1, opacity: 0.45 });
      });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const items = gsap.utils.toArray<HTMLElement>(SELECTORS[variant], root);
        const base = {
          autoAlpha: 0,
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            toggleActions: "play none none reverse",
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
