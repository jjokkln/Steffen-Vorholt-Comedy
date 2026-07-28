"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { HeroPlanet } from "@/components/home/hero-types";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Tatsächliche Anzeigebreiten der Planeten, damit der Optimizer nicht das
 * Original ausliefert: `.hero-system` ist max. 620 px breit (mobil min(88vw,420px)),
 * die Planeten belegen davon 30 % / 22 % / 18 % (siehe .hero-carrier in globals.css).
 * Ohne diese Angabe nimmt next/image 100vw an und holt die größte Variante.
 */
const PLANET_SIZES: Record<string, string> = {
  primary: "(max-width: 900px) 27vw, 190px",
  secondary: "(max-width: 900px) 20vw, 140px",
  tertiary: "(max-width: 900px) 16vw, 115px",
};

interface HeroScrollExperienceProps {
  planets: HeroPlanet[];
}

export default function HeroScrollExperience({ planets }: HeroScrollExperienceProps) {
  const rootRef = useRef<HTMLElement>(null);

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
          const conditions = context.conditions as { desktop: boolean; reduceMotion: boolean };
          const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", root);
          const heroPlanets = gsap.utils.toArray<HTMLElement>("[data-hero-planet]", root);
          const orbits = gsap.utils.toArray<HTMLElement>("[data-hero-orbit]", root);

          if (conditions.reduceMotion) {
            gsap.set(
              [...lines, ...heroPlanets, ...orbits, "[data-hero-lead]", "[data-hero-actions]"],
              { clearProps: "all" },
            );
            return;
          }

          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(lines, { yPercent: 115, autoAlpha: 0, rotate: 2, stagger: 0.1, duration: 0.85 })
            .from("[data-hero-lead]", { y: 24, autoAlpha: 0, duration: 0.55 }, "-=0.42")
            .from("[data-hero-actions]", { y: 20, autoAlpha: 0, duration: 0.5 }, "-=0.35");

          if (heroPlanets.length) {
            gsap
              .timeline({ defaults: { ease: "power2.out" } })
              .from(orbits, { scale: 0.72, autoAlpha: 0, stagger: 0.1, duration: 1.1 }, 0.1)
              .from(
                heroPlanets,
                { scale: 0.4, autoAlpha: 0, stagger: 0.14, duration: 0.9, ease: "back.out(1.6)" },
                0.5,
              );
          }

          // Maus-Parallax: das ganze Orbital-System schwebt dem Cursor leicht
          // hinterher (nur Desktop). Direkt per quickTo auf transform – kein
          // React-State, kein Re-Render pro Pointer-Tick.
          if (conditions.desktop && heroPlanets.length) {
            const system = root.querySelector<HTMLElement>("[data-hero-system]");
            if (system) {
              const xTo = gsap.quickTo(system, "x", { duration: 0.9, ease: "power3.out" });
              const yTo = gsap.quickTo(system, "y", { duration: 0.9, ease: "power3.out" });
              const onPointerMove = (event: PointerEvent) => {
                const rect = root.getBoundingClientRect();
                const relX = (event.clientX - rect.left) / rect.width - 0.5;
                const relY = (event.clientY - rect.top) / rect.height - 0.5;
                xTo(relX * -22);
                yTo(relY * -14);
              };
              root.addEventListener("pointermove", onPointerMove, { passive: true });
              context.add(() => {
                root.removeEventListener("pointermove", onPointerMove);
              });
            }
          }

          // Karten-über-Hero-Effekt: der Hero steckt in `.hero-pin-block`
          // zusammen mit der folgenden "Wähl deine Mission"-Sektion (siehe
          // app/page.tsx) und ist per CSS `position:sticky` fixiert (Desktop
          // only, siehe globals.css). Der Scroll-Fortschritt wird hier NICHT
          // per GSAP ScrollTrigger pin+scrub berechnet (das hat beim ersten
          // Anlauf durch Canvas-Repaint hinter dem backdrop-filter-Nav
          // geruckelt, siehe Commit 502c497) – stattdessen ein einzelner,
          // rAF-throttled Fenster-Scroll-Listener, der nur `transform`/`filter`
          // direkt auf `root` mutiert (kein Re-Render pro Tick).
          if (conditions.desktop) {
            const pinBlock = root.parentElement;
            if (pinBlock) {
              const NAV_HEIGHT = 84;
              const SCROLL_DISTANCE = 380;
              let frame = 0;
              const apply = () => {
                frame = 0;
                const top = pinBlock.getBoundingClientRect().top;
                const progress = Math.min(1, Math.max(0, (NAV_HEIGHT - top) / SCROLL_DISTANCE));
                root.style.transform = `scale(${1 - progress * 0.1}) translateY(${-progress * 46}px)`;
                root.style.filter = `brightness(${1 - progress * 0.45})`;
              };
              const onScroll = () => {
                if (!frame) frame = requestAnimationFrame(apply);
              };
              apply();
              window.addEventListener("scroll", onScroll, { passive: true });
              window.addEventListener("resize", onScroll);
              return () => {
                if (frame) cancelAnimationFrame(frame);
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onScroll);
                root.style.transform = "";
                root.style.filter = "";
              };
            }
          }
        },
      );

      return () => media.revert();
    },
    { scope: rootRef, dependencies: [planets.length], revertOnUpdate: true },
  );

  return (
    <header className="hero-scroll-shell" ref={rootRef}>
      <span className="hero-comet" aria-hidden="true" />
      <span className="hero-comet is-second" aria-hidden="true" />

      <Link href="/steffen" className="hero-captain" aria-label="Über Steffen – mehr erfahren">
        {/* 1122×1402 = das echte Seitenverhältnis des Freistellers; CSS gibt die
            Breite vor (clamp(280px,29vw,500px)), die Höhe folgt daraus. */}
        <Image
          className="hero-captain-photo"
          src="/assets/media/steffen/steffen-hero-cutout.png"
          alt="Steffen Vorholt"
          width={1122}
          height={1402}
          sizes="(max-width: 900px) 320px, 500px"
          priority
        />
      </Link>

      <div className="container hero-scroll-grid">
        <div className="hero-scroll-copy is-welcome" data-hero-copy>
          <div className="eyebrow">
            <span className="dot" /> WILLKOMMEN – LIVE-COMEDY AUS NRW
          </div>
          {/* Begrüßungstext von Steffen (Freigabe 28.07.2026): der Hook trägt die
              Headline, der Rest steht vollständig im Lead. Headline bewusst
              kleiner als .hero-scroll-title, weil sie dreizeilig läuft – sonst
              wächst der Hero über den Viewport und die CTAs rutschen raus. */}
          <h1 className="hero-scroll-title is-welcome">
            <span className="hero-line-mask">
              <span data-hero-line>Wenn du auf der Suche nach</span>
            </span>
            <span className="hero-line-mask">
              <span data-hero-line>schlechter Laune bist,</span>
            </span>
            <span className="hero-line-mask">
              <span data-hero-line>bist du hier <em className="gradient">leider falsch.</em> 😉</span>
            </span>
          </h1>
          <div className="lead hero-welcome-lead" data-hero-lead>
            <p>
              Ich bin Steffen Vorholt – Comedian, Veranstalter und hauptberuflicher
              Lieferant für gute Laune. Ob du mich schon kennst oder gerade erst auf mich
              aufmerksam geworden bist – ich freue mich, dass du hier bist.
            </p>
            <p>
              Mit meinen Comedy-Shows möchte ich Menschen für ein paar Stunden den Alltag
              vergessen lassen. Schau dich gerne um, entdecke meine nächsten Termine und
              erfahre mehr über meine Shows. Vielleicht sehen wir uns schon bald live!
            </p>
            <p className="hero-welcome-kicker">
              Bis dahin gilt: Nicht alles im Leben zu ernst nehmen – lachen hilft. 😉
            </p>
          </div>
          <div className="actions" data-hero-actions>
            <Link className="btn primary" href="/shows#termine">Tickets sichern</Link>
            <Link className="btn secondary" href="/shows">Welche Show passt zu mir?</Link>
          </div>
        </div>

        {planets.length > 0 && (
          <div className="hero-system" data-hero-system>
            {planets.map((planet) => (
              <span
                key={`orbit-${planet.id}`}
                className={`hero-orbit is-${planet.role}`}
                data-hero-orbit
                aria-hidden="true"
              />
            ))}

            {planets.map((planet) => (
              <div key={planet.id} className={`hero-carrier is-${planet.role}`}>
                <Link
                  href={`/shows/${planet.slug}`}
                  className={`hero-planet is-${planet.role}`}
                  style={{
                    "--planet-glow": `${planet.color}66`,
                    "--planet-color": planet.color,
                    "--sticker-shadow": `${planet.color}8C`,
                  } as CSSProperties}
                  aria-label={`Show „${planet.name}" öffnen`}
                >
                  <span className="hero-planet-inner" data-hero-planet>
                    <span className="hero-planet-float">
                      <Image
                        className="planet"
                        src={planet.imageUrl}
                        alt=""
                        width={384}
                        height={384}
                        sizes={PLANET_SIZES[planet.role]}
                        priority={planet.role === "primary"}
                        loading={planet.role === "primary" ? "eager" : "lazy"}
                      />
                    </span>
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
