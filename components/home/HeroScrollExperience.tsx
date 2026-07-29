"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MOON_SRC = "/assets/media/brand/steffens-comedyuniversum.webp";

/** Scrolldistanz, über die der Mond seine Endgröße erreicht. */
const SCROLL_DISTANCE = 520;
const NAV_HEIGHT = 84;

/**
 * Kamerafahrt des Monds, getrennt für Desktop und Mobile.
 *
 * `grow`   zusätzlicher Skalierungsfaktor am Ende (1 + grow).
 * `rise`   wie weit der Mond nach unten wandert, als Anteil seines Durchmessers —
 *          dadurch schiebt sich seine Oberkante als Horizont ins Bild, statt dass
 *          er einfach den ganzen Hero zuwächst.
 * `driftX` Wanderung Richtung Bildmitte, ebenfalls als Anteil des Durchmessers.
 * `fade`   wie weit die Copy zurücktritt, während der Mond übernimmt.
 */
const CAMERA = {
  desktop: { grow: 1.95, rise: 1.15, driftX: -0.17, fade: 0.62 },
  mobile: { grow: 1.15, rise: 0.4, driftX: 0, fade: 0.5 },
};

export default function HeroScrollExperience() {
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
          const moon = root.querySelector<HTMLElement>("[data-hero-moon]");

          if (conditions.reduceMotion) {
            gsap.set([...lines, "[data-hero-lead]", "[data-hero-actions]", "[data-hero-moon]"], {
              clearProps: "all",
            });
            // Kein rAF-Loop: kein Kamera-Zoom, keine Leerlauf-Schwebung. Der Mond
            // steht in seiner Ruhegröße, siehe .hero-moon in globals.css.
            return;
          }

          const cleanups: Array<() => void> = [];

          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from(lines, { yPercent: 115, autoAlpha: 0, rotate: 2, stagger: 0.1, duration: 0.85 })
            .from("[data-hero-lead]", { y: 24, autoAlpha: 0, duration: 0.55 }, "-=0.42")
            .from("[data-hero-actions]", { y: 20, autoAlpha: 0, duration: 0.5 }, "-=0.35");

          // ── Der Mond ─────────────────────────────────────────────────────
          // Ein einziges Key Visual statt der drei Orbit-Planeten: rechts
          // zentriert, und beim Scrollen wächst es zum Trabanten, der über der
          // hochziehenden Sektion hängt. Wie beim Rest des Heros läuft das über
          // EINEN rAF-Tick mit direkter Style-Mutation — kein React-State pro
          // Frame und kein ScrollTrigger mit pin+scrub (das ruckelte durch
          // Canvas-Repaint hinter dem backdrop-filter-Nav, Commit 502c497).
          //
          // Start erst im onComplete des Entrance-Tweens: beide schreiben auf
          // `transform` des Monds und würden sich sonst überschreiben.
          const startMoon = () => {
            if (!moon) return;
            const copy = root.querySelector<HTMLElement>("[data-hero-copy]");
            const cfg = conditions.desktop ? CAMERA.desktop : CAMERA.mobile;
            // Fortschritt am `.hero-pin-block` messen, nicht am Hero selbst: der
            // ist auf Desktop `position:sticky;top:84px` und hätte damit konstant
            // `top === NAV_HEIGHT`, also dauerhaft Fortschritt 0.
            const progressEl = root.parentElement ?? root;

            let size = moon.offsetWidth;
            const onResize = () => {
              size = moon.offsetWidth;
            };
            window.addEventListener("resize", onResize);

            let pointerTargetX = 0;
            let pointerTargetY = 0;
            let pointerX = 0;
            let pointerY = 0;
            const t0 = performance.now();
            let frame = 0;

            const tick = (now: number) => {
              frame = requestAnimationFrame(tick);
              if (document.hidden) return;
              const heroRect = root.getBoundingClientRect();
              if (heroRect.bottom < 0 || heroRect.top > window.innerHeight) return;

              const top = progressEl.getBoundingClientRect().top;
              const p = Math.min(1, Math.max(0, (NAV_HEIGHT - top) / SCROLL_DISTANCE));
              const ease = p * p * (3 - 2 * p);
              const secs = (now - t0) / 1000;

              // Maus-Parallax läuft im selben Tick: zwei Schreiber auf einem
              // transform machen sich gegenseitig platt.
              pointerX += (pointerTargetX - pointerX) * 0.09;
              pointerY += (pointerTargetY - pointerY) * 0.09;
              // Begrenzte Leerlauf-Schwebung (sin), keine Dauerbewegung — sonst
              // wandert der Mond mit der Zeit aus seiner Komposition.
              const bob = Math.sin(secs * 0.3) * 8 * (1 - ease);

              moon.style.transform =
                `translate3d(${size * cfg.driftX * ease + pointerX}px,` +
                `${size * cfg.rise * ease + bob + pointerY}px,0) ` +
                `scale(${1 + ease * cfg.grow})`;
              // Riesig heißt: der Mond liegt über der halben Seite. Ein Link, der
              // dann die ganze Fläche abfängt, wäre eine Falle.
              moon.style.pointerEvents = ease > 0.12 ? "none" : "auto";

              // Copy tritt zurück, während der Mond übernimmt — sonst steht die
              // Headline im gewachsenen Bild.
              if (copy) copy.style.opacity = String(1 - ease * cfg.fade);
            };

            frame = requestAnimationFrame(tick);

            const onPointerMove = (event: PointerEvent) => {
              const rect = root.getBoundingClientRect();
              pointerTargetX = ((event.clientX - rect.left) / rect.width - 0.5) * -26;
              pointerTargetY = ((event.clientY - rect.top) / rect.height - 0.5) * -16;
            };
            if (conditions.desktop) root.addEventListener("pointermove", onPointerMove, { passive: true });

            cleanups.push(() => {
              cancelAnimationFrame(frame);
              window.removeEventListener("resize", onResize);
              root.removeEventListener("pointermove", onPointerMove);
              moon.style.transform = "";
              moon.style.pointerEvents = "";
              if (copy) copy.style.opacity = "";
            });
          };

          if (moon) {
            gsap.timeline({ onComplete: startMoon }).from(
              moon,
              { scale: 0.62, autoAlpha: 0, duration: 1.05, ease: "back.out(1.4)" },
              0.35,
            );
          }

          // Karten-über-Hero-Effekt: der Hero steckt in `.hero-pin-block`
          // zusammen mit dem Trailer und der "Wähl deine Mission"-Sektion (siehe
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
                // Nur noch leicht abdunkeln: der Mond ist jetzt das Motiv dieser
                // Szene und soll beim Wachsen nicht wegdimmen.
                root.style.filter = `brightness(${1 - progress * 0.18})`;
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
    { scope: rootRef, revertOnUpdate: true },
  );

  return (
    <header className="hero-scroll-shell" ref={rootRef}>
      <span className="hero-comet" aria-hidden="true" />
      <span className="hero-comet is-second" aria-hidden="true" />

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

        <Link
          href="/shows"
          className="hero-moon"
          data-hero-moon
          aria-label="Steffens Comedyuniversum – alle Shows ansehen"
        >
          <Image
            src={MOON_SRC}
            alt="Steffens Comedyuniversum: Steffen Vorholt mit den Planeten Brain Loading, Comedy Eiskalt und Doppel-Comedy"
            width={1400}
            height={1400}
            sizes="(max-width: 900px) 86vw, 620px"
            priority
          />
        </Link>
      </div>
    </header>
  );
}
