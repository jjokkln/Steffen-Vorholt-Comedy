"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import HeroGalaxyScene from "@/components/home/HeroGalaxyScene";
import type { HeroMotionState, HeroPlanet } from "@/components/home/hero-types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HeroScrollExperienceProps {
  planets: HeroPlanet[];
  showCount: number;
  cityCount: number;
  formatCount: number;
}

export default function HeroScrollExperience({
  planets,
  showCount,
  cityCount,
  formatCount,
}: HeroScrollExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const motionState = useRef<HeroMotionState>({ progress: 0, pointerX: 0, pointerY: 0 });
  const [sceneEnabled, setSceneEnabled] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);

  const handleReady = useCallback(() => setSceneReady(true), []);
  const handleFallback = useCallback(() => {
    setSceneReady(false);
    setSceneEnabled(false);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const sync = () => setSceneEnabled(!reduced.matches && !connection?.saveData);
    sync();
    reduced.addEventListener("change", sync);
    return () => reduced.removeEventListener("change", sync);
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const media = gsap.matchMedia();

      media.add(
        {
          desktop: "(min-width: 901px)",
          mobile: "(max-width: 900px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const conditions = context.conditions as {
            desktop: boolean;
            mobile: boolean;
            reduceMotion: boolean;
          };
          const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", root);
          const counters = gsap.utils.toArray<HTMLElement>("[data-counter]", root);

          if (conditions.reduceMotion) {
            motionState.current.progress = 0;
            gsap.set([...lines, ...counters], { clearProps: "all" });
            return;
          }

          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(lines, { yPercent: 115, autoAlpha: 0, rotate: 2, stagger: 0.1, duration: 0.85 })
            .from("[data-hero-lead]", { y: 24, autoAlpha: 0, duration: 0.55 }, "-=0.42")
            .from("[data-hero-actions]", { y: 20, autoAlpha: 0, duration: 0.5 }, "-=0.35")
            .from("[data-hero-proof]", { y: 16, autoAlpha: 0, duration: 0.45 }, "-=0.28");

          counters.forEach((element) => {
            const target = Number(element.dataset.counter || 0);
            const value = { current: 0 };
            gsap.to(value, {
              current: target,
              duration: 1.2,
              delay: 0.35,
              ease: "power2.out",
              snap: { current: 1 },
              onUpdate: () => {
                element.textContent = String(Math.round(value.current));
              },
            });
          });

          // Planeten ruhen als feste Reihe (progress=0 desktop, =1 mobil) und
          // schweben per Idle-Float in der WebGL-Szene – KEIN Scroll-Pin/Scrub
          // mehr. Das war die Ursache des Ruckelns: pin+scrub ließ Canvas,
          // Portal-Glow und Copy hinter dem backdrop-filter-Nav jeden Frame neu
          // rastern. Nur ein günstiger, nicht-gepinnter Fade des Scroll-Cues.
          motionState.current.progress = conditions.desktop ? 0 : 1;

          gsap.to("[data-scroll-cue]", {
            autoAlpha: 0,
            y: 12,
            duration: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: root,
              start: "top top-=40",
              toggleActions: "play none none reverse",
            },
          });

          if (!conditions.desktop) {
            gsap.from("[data-hero-fallback]", {
              y: 24,
              autoAlpha: 0,
              scale: 0.94,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: { trigger: root, start: "top 82%", once: true },
            });
          }
        },
      );

      return () => media.revert();
    },
    { scope: rootRef, dependencies: [planets.length], revertOnUpdate: true },
  );

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    motionState.current.pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    motionState.current.pointerY = (event.clientY - rect.top) / rect.height - 0.5;
  };

  const handlePointerLeave = () => {
    motionState.current.pointerX = 0;
    motionState.current.pointerY = 0;
  };

  return (
    <header
      className="hero-scroll-shell"
      ref={rootRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="hero-portal-glow" aria-hidden="true" />

      <div className={`hero-visual-stage${sceneReady ? " webgl-ready" : ""}`}>
        {sceneEnabled && (
          <HeroGalaxyScene
            planets={planets}
            motionState={motionState}
            onReady={handleReady}
            onFallback={handleFallback}
          />
        )}

        <div
          className={`hero-static-fallback${sceneReady ? " is-hidden" : ""}`}
          data-hero-fallback
          aria-hidden="true"
        >
          {planets.map((planet) => {
            const size =
              planet.role === "primary" ? 260 : planet.role === "secondary" ? 185 : 148;
            return (
              <span
                className={`hero-fallback-planet is-${planet.role}`}
                key={planet.id}
                style={{
                  "--planet-glow": `${planet.color}59`,
                  "--sticker-shadow": `${planet.color}8C`,
                } as CSSProperties}
              >
                {planet.role === "primary" && <span className="orbit" />}
                <img
                  className="planet"
                  src={planet.imageUrl}
                  alt=""
                  width={size}
                  height={size}
                  loading={planet.role === "primary" ? "eager" : "lazy"}
                  fetchPriority={planet.role === "primary" ? "high" : "auto"}
                />
              </span>
            );
          })}
        </div>
      </div>

      <div className="container hero-scroll-grid">
        <div className="hero-scroll-copy" data-hero-copy>
          <div className="eyebrow">
            <span className="dot" /> LIVE-COMEDY AUS NRW
          </div>
          <h1 className="hero-scroll-title">
            <span className="hero-line-mask"><span data-hero-line>Comedy aus einer</span></span>
            <span className="hero-line-mask"><span data-hero-line>anderen</span></span>
            <span className="hero-line-mask">
              <em className="gradient" data-hero-line>Galaxie.</em>
            </span>
          </h1>
          <p className="lead" data-hero-lead>
            Drei Shows, ein Host: Steffen Vorholt bringt Impro, Open Mic und Boarding-Comedy
            auf die Bühnen von NRW.
          </p>
          <div className="actions" data-hero-actions>
            <Link className="btn primary" href="/termine">Tickets sichern</Link>
            <Link className="btn secondary" href="/shows">Welche Show passt zu mir?</Link>
          </div>
          <div className="proof-row" data-hero-proof>
            <span><b data-counter={showCount}>{showCount}</b> Shows gespielt</span>
            <span><b data-counter={cityCount}>{cityCount}</b> Städte</span>
            <span><b data-counter={formatCount}>{formatCount}</b> eigene Formate</span>
          </div>
        </div>
      </div>
      <div className="hero-scroll-cue" data-scroll-cue aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </header>
  );
}
