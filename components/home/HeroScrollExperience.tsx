"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import AiLabel from "@/components/AiLabel";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MOON_SRC = "/assets/media/brand/steffens-comedyuniversum.webp";

/** Scrolldistanz, über die der Mond seine Kamerafahrt abfährt (nur Desktop). */
const SCROLL_DISTANCE = 520;
const NAV_HEIGHT = 84;

/**
 * Kamerafahrt des Monds, getrennt für Desktop und Mobile.
 *
 * Der Mond wächst beim Scrollen NICHT mehr (früher `grow`), er zieht sich
 * zurück: kleiner werden plus Ausblenden, sodass er aufgelöst ist, wenn die
 * nächste Sektion übernimmt. Vorher wuchs er zum Horizont – das nahm der
 * Startseite beim Scrollen die Luft und stand im Weg.
 *
 * `shrink`   Anteil, den der Mond am Ende verloren hat (scale = 1 - shrink).
 * `rise`     Wanderung auf der Y-Achse, als Anteil seines Durchmessers.
 *            Positiv = sinkt nach unten weg, negativ = zieht nach oben ab.
 * `driftX`   Wanderung Richtung Bildmitte, ebenfalls als Anteil des Durchmessers.
 * `fade`     wie weit die Copy zurücktritt, während die Szene wegzieht.
 * `dissolve` Ausblend-Tempo relativ zum Fortschritt. 1.25 heißt: bei 80 % des
 *            Fortschritts ist der Mond ganz weg — auf Desktop also bevor der
 *            Trailer den Hero überschiebt (SHELL_SCROLL_DISTANCE = 380); man
 *            scrollt nicht an einem halbtransparenten Mond vorbei.
 *
 * Desktop und Mobile fahren bewusst unterschiedliche Kurven, weil der Mond
 * unterschiedlich im Layout steht (siehe MOBILE_PROGRESS unten):
 * Desktop rechts absolut neben der Copy, Mobile darunter im normalen Fluss.
 *
 * Mobile ist deshalb bewusst ein reiner Parallax: der Mond wandert nach OBEN
 * (rise negativ), sonst nichts — kein Schrumpfen, kein Ausblenden. Ein Fade
 * wurde verworfen (Freigabe 30.07.2026): auf dem Handy ist der Mond das einzige
 * Bild im Hero, ein halb aufgelöster Mond sah kaputt aus statt elegant. Weil
 * alle Werte allein aus der Scroll-Position folgen und nirgends Zustand hängt,
 * ist die Bewegung exakt umkehrbar — zurückscrollen trifft denselben Punkt.
 */
const CAMERA = {
  desktop: { shrink: 0.72, rise: 0.18, driftX: -0.12, fade: 0.35, dissolve: 1.25 },
  mobile: { shrink: 0, rise: -0.52, driftX: 0, fade: 0, dissolve: 0 },
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
          // Ein einziges Key Visual statt der drei Orbit-Planeten. Beim Scrollen
          // zieht es sich zurück: kleiner werden + ausblenden, bis es weg ist und
          // die nächste Sektion die Bühne allein hat. Wie beim Rest des Heros
          // läuft das über
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

            // ── Fortschritt, zwei Messpunkte ───────────────────────────────
            // Desktop: feste Scrolldistanz ab Hero-Oberkante. Der Hero ist dort
            // sticky, der Mond steht die ganze Zeit im Bild — die Fahrt kann also
            // sofort beim ersten Scrollen losgehen.
            //
            // Mobile: ab Hero-Oberkante wäre falsch. Der Mond steht dort UNTER der
            // Copy im Fluss und kommt erst nach ~1100 px Scroll überhaupt ins
            // Bild — die Fahrt war da längst durch und man sah nur eine statische
            // große Kugel. Gemessen wird deshalb, wie der Hero-BODEN durch den
            // Viewport nach oben läuft:
            //   0 = Hero-Ende am unteren Viewport-Rand (Mond gerade voll im Bild)
            //   1 = Hero-Ende an der Viewport-Oberkante (Trailer füllt den Screen)
            // Damit läuft die Fahrt genau in dem Fenster, in dem man den Mond
            // wirklich sieht. Reine Funktion der Scroll-Position, also umkehrbar.
            // Bezug ist `root` (nicht der Mond selbst): der Mond trägt den
            // transform, den wir gerade schreiben — an ihm zu messen wäre eine
            // Rückkopplung. Auf Mobile wird `root` nicht transformiert (der
            // Shell-Scroll-Effekt unten läuft nur auf Desktop), ist also stabil.
            const MOBILE_PROGRESS = (heroBottom: number) =>
              1 - heroBottom / Math.max(1, window.innerHeight);

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

              const raw = conditions.desktop
                ? (NAV_HEIGHT - progressEl.getBoundingClientRect().top) / SCROLL_DISTANCE
                : MOBILE_PROGRESS(heroRect.bottom);
              const p = Math.min(1, Math.max(0, raw));
              const ease = p * p * (3 - 2 * p);
              const secs = (now - t0) / 1000;

              // Maus-Parallax läuft im selben Tick: zwei Schreiber auf einem
              // transform machen sich gegenseitig platt.
              pointerX += (pointerTargetX - pointerX) * 0.09;
              pointerY += (pointerTargetY - pointerY) * 0.09;
              // Begrenzte Leerlauf-Schwebung (sin), keine Dauerbewegung — sonst
              // wandert der Mond mit der Zeit aus seiner Komposition. Nur Desktop:
              // auf Mobile soll die Position ALLEIN am Scroll hängen, damit
              // Zurückscrollen exakt denselben Punkt trifft. Die Schwebung ist
              // zeitabhängig und verschob den Mond je Messung um bis zu 8 px.
              const bob = conditions.desktop ? Math.sin(secs * 0.3) * 8 * (1 - ease) : 0;

              const opacity = Math.max(0, 1 - ease * cfg.dissolve);

              moon.style.transform =
                `translate3d(${size * cfg.driftX * ease + pointerX}px,` +
                `${size * cfg.rise * ease + bob + pointerY}px,0) ` +
                `scale(${1 - ease * cfg.shrink})`;
              moon.style.opacity = String(opacity);
              // Ein unsichtbarer Link, der noch Klicks abfängt, ist eine Falle —
              // sobald der Mond weitgehend aufgelöst ist, ist er auch inaktiv.
              moon.style.pointerEvents = opacity < 0.4 ? "none" : "auto";

              // Copy tritt mit zurück, damit die ganze Szene gemeinsam wegzieht
              // statt nur der Mond.
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
              moon.style.opacity = "";
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
                // Nur leicht abdunkeln: der Mond löst sich ohnehin schon selbst
                // auf, ein zweiter starker Dimmer wäre doppelt.
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
          {/* Kein Eyebrow-Badge über der Headline: der Hook soll als Erstes
              greifen, das Pill wirkte davor wie ein Fremdkörper. */}
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
              Ich bin Steffen Vorholt. Comedian, Veranstalter und hauptberuflicher
              Lieferant für gute Laune. Ob du mich schon kennst oder gerade erst auf mich
              aufmerksam geworden bist... Ich freue mich, dass du hier bist.
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

        {/* Wrapper statt Link als Animationsziel: die KI-Kennzeichnung muss die
            Kamerafahrt mitmachen, darf aber nicht IN den Link — dessen
            `aria-label` würde den Alt-Text des Zeichens verschlucken. Warum das
            so gebaut ist, steht ausführlich an `.hero-moon-wrap` in globals.css. */}
        <div className="hero-moon-wrap" data-hero-moon>
          <Link
            href="/shows"
            className="hero-moon"
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
          {/* Art. 50 EU AI Act: das Key Visual ist eine KI-Bearbeitung — Steffens
              echtes Foto, per KI in die Kugel mit den drei Show-Planeten gesetzt.
              Teilweise verändert, also `modified`, nicht `generated`. */}
          <AiLabel className="hero-moon-ai-label" text="Bild mit KI bearbeitet" />
        </div>
      </div>
    </header>
  );
}
