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
 * Original ausliefert: `.hero-system` ist max. 760 px breit (mobil min(88vw,420px)),
 * die Planeten belegen davon 40 % / 29 % / 23 % (siehe .hero-carrier in globals.css).
 * Ohne diese Angabe nimmt next/image 100vw an und holt die größte Variante.
 */
const PLANET_SIZES: Record<string, string> = {
  primary: "(max-width: 900px) 36vw, 304px",
  secondary: "(max-width: 900px) 26vw, 221px",
  tertiary: "(max-width: 900px) 21vw, 175px",
};

/**
 * Bahn-Parameter des scrollgebundenen Orbital-Systems (Rolle → Bahn).
 *
 * `start`  Ruhewinkel der Bahn (identisch zu --start in globals.css, sonst
 *          springt die Komposition beim ersten Tick).
 * `sweep`  wie weit die Bahn über SCROLL_DISTANCE weiterdreht.
 * `amp`/`speed` begrenzte Leerlauf-Schwingung (sin, 3.5–5°) – bewusst KEINE
 *          Dauerrotation: die wanderte mit der Zeit weg, nach einer Minute lagen
 *          die Planeten über Headline und Steffen-Foto.
 * `depth`/`drift` Tiefenstaffelung beim Hineinfahren der Kamera.
 */
const ORBITS: Record<
  string,
  { start: number; sweep: number; amp: number; speed: number; depth: number; drift: [number, number] }
> = {
  primary: { start: 28, sweep: 210, amp: 5, speed: 0.16, depth: 0.46, drift: [26, -30] },
  secondary: { start: 148, sweep: -150, amp: -4, speed: 0.11, depth: 0.24, drift: [22, 20] },
  tertiary: { start: 68, sweep: 108, amp: 3.5, speed: 0.09, depth: 0.1, drift: [14, 24] },
};
const SCROLL_DISTANCE = 620;
const NAV_HEIGHT = 84;

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

          if (conditions.reduceMotion) {
            gsap.set([...lines, ...heroPlanets, "[data-hero-lead]", "[data-hero-actions]"], {
              clearProps: "all",
            });
            // Kein rAF-Loop: damit gibt es weder Leerlauf-Schwingung noch
            // Kamera-Zoom. Die Planeten stehen auf den Ruhewinkeln, die
            // `.hero-carrier`/`.hero-planet-inner` in globals.css setzen.
            return;
          }

          // Aufräumer sammeln, damit mehrere Effekte in derselben
          // matchMedia-Bedingung nebeneinander laufen können.
          const cleanups: Array<() => void> = [];

          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(lines, { yPercent: 115, autoAlpha: 0, rotate: 2, stagger: 0.1, duration: 0.85 })
            .from("[data-hero-lead]", { y: 24, autoAlpha: 0, duration: 0.55 }, "-=0.42")
            .from("[data-hero-actions]", { y: 20, autoAlpha: 0, duration: 0.5 }, "-=0.35");

          // ── Scrollgebundenes Orbital-System ──────────────────────────────
          // Läuft NICHT über ScrollTrigger mit pin+scrub (das hat beim ersten
          // Anlauf durch Canvas-Repaint hinter dem backdrop-filter-Nav
          // geruckelt, siehe Commit 502c497) – stattdessen ein einzelner
          // rAF-Tick, der `transform`/`opacity` direkt auf die Elemente
          // schreibt. Kein React-State, kein Re-Render pro Frame.
          //
          // Der Entrance-Tween unten schreibt selbst auf `transform` von
          // [data-hero-planet]; der Loop startet deshalb erst in `onComplete`,
          // sonst überschreiben sich beide gegenseitig.
          //
          // Desktop only, und zwar aus Layout-Gründen: die Choreografie hängt am
          // `.hero-pin-block`, der auf Mobile ganz oben auf der Seite beginnt.
          // Das System steht dort aber erst unter der Copy – wenn es in Sicht
          // kommt, ist der Sweep längst durchgelaufen und alle drei Planeten
          // klumpen an einem Punkt. Mobil bleibt deshalb die Ruhekomposition
          // aus globals.css stehen, inklusive planet-float.
          const startOrbit = () => {
            const system = root.querySelector<HTMLElement>("[data-hero-system]");
            const carriers = gsap.utils
              .toArray<HTMLElement>("[data-hero-carrier]", root)
              .map((carrier) => ({
                carrier,
                hold: carrier.querySelector<HTMLElement>("[data-hero-planet]"),
                orbit: ORBITS[carrier.dataset.heroCarrier ?? ""] ?? ORBITS.primary,
              }));
            if (!carriers.length) return;

            // Fortschritt am `.hero-pin-block` messen, nicht am Hero selbst:
            // der ist auf Desktop `position:sticky;top:84px` und hätte damit
            // konstant `top === NAV_HEIGHT`, also dauerhaft Fortschritt 0.
            const progressEl = root.parentElement ?? root;
            let pointerTargetX = 0;
            let pointerTargetY = 0;
            let pointerX = 0;
            let pointerY = 0;
            const t0 = performance.now();
            let frame = 0;

            const tick = (now: number) => {
              frame = requestAnimationFrame(tick);
              if (document.hidden) return;
              // Hero komplett aus dem Bild → nichts zu rechnen.
              const heroRect = root.getBoundingClientRect();
              if (heroRect.bottom < 0 || heroRect.top > window.innerHeight) return;

              const top = progressEl.getBoundingClientRect().top;
              const p = Math.min(1, Math.max(0, (NAV_HEIGHT - top) / SCROLL_DISTANCE));
              const ease = p * p * (3 - 2 * p);
              const secs = (now - t0) / 1000;

              if (system) {
                // Maus-Parallax: das System schwebt dem Cursor hinterher.
                // Läuft über dieselbe transform-Mutation, weil zwei Schreiber
                // auf einem transform sich sonst gegenseitig plattmachen.
                pointerX += (pointerTargetX - pointerX) * 0.09;
                pointerY += (pointerTargetY - pointerY) * 0.09;
                system.style.transform =
                  `scale(${1 + ease * 0.34}) ` +
                  `translate3d(${ease * -50 + pointerX}px,${ease * 20 + pointerY}px,0)`;
                system.style.opacity = String(1 - ease * 0.22);
              }

              for (const { carrier, hold, orbit } of carriers) {
                const angle = orbit.start + ease * orbit.sweep + Math.sin(secs * orbit.speed) * orbit.amp;
                carrier.style.transform = `rotate(${angle}deg)`;
                if (!hold) continue;
                // Gegenrotation hält Planet und Motiv aufrecht, depth/drift
                // staffeln die drei Bahnen in der Tiefe.
                hold.style.transform =
                  `rotate(${-angle}deg) scale(${1 + ease * orbit.depth}) ` +
                  `translate3d(${ease * orbit.drift[0]}px,${ease * orbit.drift[1]}px,0)`;
              }
            };

            frame = requestAnimationFrame(tick);

            const onPointerMove = (event: PointerEvent) => {
              const rect = root.getBoundingClientRect();
              pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * -22;
              pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * -14;
            };
            root.addEventListener("pointermove", onPointerMove, { passive: true });

            cleanups.push(() => {
              cancelAnimationFrame(frame);
              root.removeEventListener("pointermove", onPointerMove);
              if (system) {
                system.style.transform = "";
                system.style.opacity = "";
              }
              for (const { carrier, hold } of carriers) {
                carrier.style.transform = "";
                if (hold) hold.style.transform = "";
              }
            });
          };

          if (heroPlanets.length) {
            gsap
              .timeline({
                defaults: { ease: "power2.out" },
                onComplete: conditions.desktop ? startOrbit : undefined,
              })
              .from(
                heroPlanets,
                { scale: 0.4, autoAlpha: 0, stagger: 0.14, duration: 0.9, ease: "back.out(1.6)" },
                0.5,
              );
          }

          // Karten-über-Hero-Effekt: der Hero steckt in `.hero-pin-block`
          // zusammen mit der folgenden "Wähl deine Mission"-Sektion (siehe
          // app/page.tsx) und ist per CSS `position:sticky` fixiert (Desktop
          // only, siehe globals.css). Auch hier kein ScrollTrigger, sondern ein
          // rAF-throttled Fenster-Scroll-Listener, der nur `transform`/`filter`
          // direkt auf `root` mutiert (kein Re-Render pro Tick).
          if (conditions.desktop) {
            const pinBlock = root.parentElement;
            if (pinBlock) {
              const SHELL_SCROLL_DISTANCE = 380;
              let frame = 0;
              const apply = () => {
                frame = 0;
                const top = pinBlock.getBoundingClientRect().top;
                const progress = Math.min(1, Math.max(0, (NAV_HEIGHT - top) / SHELL_SCROLL_DISTANCE));
                root.style.transform = `scale(${1 - progress * 0.1}) translateY(${-progress * 46}px)`;
                root.style.filter = `brightness(${1 - progress * 0.45})`;
              };
              const onScroll = () => {
                if (!frame) frame = requestAnimationFrame(apply);
              };
              apply();
              window.addEventListener("scroll", onScroll, { passive: true });
              window.addEventListener("resize", onScroll);
              cleanups.push(() => {
                if (frame) cancelAnimationFrame(frame);
                window.removeEventListener("scroll", onScroll);
                window.removeEventListener("resize", onScroll);
                root.style.transform = "";
                root.style.filter = "";
              });
            }
          }

          return () => {
            for (const cleanup of cleanups) cleanup();
          };
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
              <div
                key={planet.id}
                className={`hero-carrier is-${planet.role}`}
                data-hero-carrier={planet.role}
              >
                <Link
                  href={`/shows/${planet.slug}`}
                  className={`hero-planet is-${planet.role}`}
                  style={{
                    "--planet-glow": `${planet.color}80`,
                    "--planet-glow-hover": `${planet.color}D9`,
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
