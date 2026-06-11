# Phase 5: Redesign „Cosmic-Galaxie" (Motion, Buzzer, neue Startseite) — Tasks 20–24

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Premium-Basis + verspielte Schicht: Space-Grotesk-Typo, Gold-CTAs, Termin-Laufband, schwebende Planeten mit Sticker-Labels, Scroll-Reveals, Counter, Buzzer mit Konfetti, komplett neue Startseite, Comedy-404.

**Architecture:** Dauerläufer-Animationen = reines CSS (Ticker, Planet-Float, Sternschnuppe). Scroll-/Interaktions-Motion = framer-motion in kleinen Client-Wrappern (`components/motion/*`). Alles respektiert `prefers-reduced-motion`.

**Tech Stack:** `next/font/google`, framer-motion, canvas-confetti, plain CSS in `app/globals.css`.

**Referenz fürs Look-and-Feel:** Hybrid-Mockup aus dem Brainstorming: `.superpowers/brainstorm/67030-1781215617/content/design-hybrid.html` (falls vorhanden — beschreibt Laufband oben, Glas-Nav, Gold-CTA, Planeten-Cluster rechts mit weißen Sticker-Labels und harten Farbschatten, Social-Proof-Zeile unter den CTAs).

---

### Task 20: Typografie + Design-Tokens + neue CSS-Bausteine

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1: Fonts in `app/layout.tsx`** — oben ergänzen und am `<body>` (bzw. `<html>`-Kind mit className) registrieren:

```tsx
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });

// <body> erhält: className={`${inter.variable} ${grotesk.variable}`}
```

- [ ] **Step 2: `app/globals.css` anpassen.**
  (a) In `body { font-family: ... }` ersetzen durch `font-family: var(--font-body), Inter, ui-sans-serif, system-ui, sans-serif;`
  (b) Nach der `h1,h2,h3`-Regel ergänzen: `h1,h2,h3,h4{font-family:var(--font-display),Inter,sans-serif}`
  (c) In `:root` ergänzen: `--gold1:#f5d68a;--gold2:#e8a33d;`
  (d) `.primary`-Regel ersetzen durch:

```css
.primary{background:linear-gradient(135deg,var(--gold1),var(--gold2));color:#050711;box-shadow:0 18px 44px rgba(232,163,61,.28)}
```

  (e) Am Dateiende anhängen (neue Bausteine):

```css
/* === Cosmic-Galaxie Bausteine === */
.ticker{overflow:hidden;background:linear-gradient(90deg,var(--green),var(--blue));color:#050711;font-weight:900;letter-spacing:.14em;font-size:12px;text-transform:uppercase}
.ticker-track{display:flex;gap:48px;white-space:nowrap;padding:9px 0;width:max-content;animation:ticker 26s linear infinite}
@keyframes ticker{to{transform:translateX(-50%)}}

.sticker{display:inline-block;background:#fff;color:#06070f;font-weight:900;font-size:13px;padding:6px 12px;border-radius:12px;transform:rotate(var(--rot,-3deg));box-shadow:4px 4px 0 var(--sticker-shadow,rgba(124,255,107,.55));transition:transform .2s ease}

.planet-wrap{position:relative;display:inline-grid;place-items:center}
.planet{border-radius:50%;animation:planet-float 7s ease-in-out infinite;filter:drop-shadow(0 0 38px var(--planet-glow,rgba(124,255,107,.35)));transition:transform .25s ease}
.planet-wrap:hover .planet{animation-play-state:paused;transform:rotate(-8deg) scale(1.06)}
.planet-wrap:hover .sticker{transform:rotate(var(--rot,-3deg)) scale(1.12)}
@keyframes planet-float{50%{transform:translateY(-14px) rotate(3deg)}}
.orbit{position:absolute;border:1.5px solid rgba(255,255,255,.22);border-radius:50%;width:135%;height:44%;transform:rotate(-16deg);pointer-events:none}

.hero-cluster{position:relative;min-height:380px}
.hero-cluster .cluster-item{position:absolute}

.shooting-star{position:fixed;top:12%;left:-10%;width:140px;height:2px;background:linear-gradient(90deg,transparent,#fff);transform:rotate(18deg);animation:shoot 9s linear infinite;opacity:0;pointer-events:none;z-index:0}
@keyframes shoot{0%,86%{opacity:0;transform:translateX(0) rotate(18deg)}88%{opacity:1}100%{opacity:0;transform:translateX(120vw) rotate(18deg)}}

.proof-row{display:flex;gap:26px;flex-wrap:wrap;margin-top:24px;color:var(--muted);font-size:14px}
.proof-row b{color:var(--text);font-size:20px;font-family:var(--font-display),sans-serif}

.buzzer-zone{display:grid;place-items:center;gap:18px;text-align:center}
.buzzer{width:150px;height:150px;border-radius:50%;border:0;cursor:pointer;background:radial-gradient(circle at 35% 30%,#ff7a7a,#e02525 60%,#8f0f0f);color:#fff;font-weight:950;font-size:22px;letter-spacing:.08em;box-shadow:0 14px 0 #7a0c0c,0 26px 60px rgba(224,37,37,.35);transition:transform .08s ease,box-shadow .08s ease}
.buzzer:active{transform:translateY(10px);box-shadow:0 4px 0 #7a0c0c,0 12px 30px rgba(224,37,37,.3)}
.buzzer-line{font-size:clamp(18px,2.4vw,26px);font-weight:800;color:var(--text);max-width:640px;min-height:2.4em}

.gallery-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.gallery-grid figure{margin:0;border-radius:18px;overflow:hidden;border:1px solid var(--line);transform:rotate(var(--rot,0deg));transition:transform .25s ease}
.gallery-grid figure:hover{transform:rotate(0) scale(1.03)}
.gallery-grid img{width:100%;height:220px;object-fit:cover}
.gallery-grid figcaption{padding:10px 14px;font-size:13px;color:var(--muted)}

.calendar-event{animation:event-pulse 2.6s ease-in-out infinite}
@keyframes event-pulse{50%{filter:brightness(1.2)}}

@media (prefers-reduced-motion: reduce){
  .ticker-track,.planet,.shooting-star,.calendar-event{animation:none}
  body:before{animation:none}
}
```

- [ ] **Step 3: Build + Sichtprüfung** — `npm run build`; Headlines sind jetzt Space Grotesk, Primary-Buttons gold.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Cosmic-Galaxie Design-Tokens, Fonts und CSS-Bausteine"
```

---

### Task 21: Motion-Primitives + Ticker + Planeten-Komponenten

**Files:**
- Create: `components/motion/Reveal.tsx`, `components/motion/Counter.tsx`, `components/motion/WordReveal.tsx`, `components/Ticker.tsx`, `components/Planet.tsx`

- [ ] **Step 1: `components/motion/Reveal.tsx`:**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: `components/motion/Counter.tsx`:**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export default function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(to);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1200);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to]);

  return (
    <b ref={ref}>
      {n}
      {suffix}
    </b>
  );
}
```

- [ ] **Step 3: `components/motion/WordReveal.tsx`:**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function WordReveal({ text, className }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          style={{ display: "inline-block", marginRight: "0.25em" }}
          initial={{ opacity: 0, y: 24, rotate: -4 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.15 + i * 0.09, duration: 0.5, ease: "backOut" }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}
```

- [ ] **Step 4: `components/Ticker.tsx`** (Server Component — nächster Termin aus DB):

```tsx
import { getPublishedEvents } from "@/lib/data";
import { partitionEvents, formatDateLong } from "@/lib/event-helpers";

export default async function Ticker() {
  const { upcoming } = partitionEvents(await getPublishedEvents());
  const next = upcoming[0];
  const text = next
    ? `✦ Nächste Show: ${next.shows?.name} · ${formatDateLong(next.date)} · ${next.city} ✦ Tickets jetzt sichern`
    : "✦ Neue Termine in Arbeit ✦ Steffen schreibt gerade neue Witze";
  const content = Array(4).fill(text).join("  ");

  return (
    <a href="/termine" className="ticker" aria-label="Zum Kalender">
      <div className="ticker-track">
        <span>{content}</span>
        <span aria-hidden="true">{content}</span>
      </div>
    </a>
  );
}
```

- [ ] **Step 5: `components/Planet.tsx`** (Planet-Bild + Orbit + Sticker; Glow/Schatten in Show-Farbe):

```tsx
import { mediaUrl } from "@/lib/media";
import type { CSSProperties } from "react";

export default function Planet({
  src,
  alt,
  size,
  color,
  sticker,
  rotation = "-3deg",
  withOrbit = false,
}: {
  src: string;
  alt: string;
  size: number;
  color: string;
  sticker?: string;
  rotation?: string;
  withOrbit?: boolean;
}) {
  const style = {
    "--planet-glow": `${color}59`, // ~35% Alpha
    "--sticker-shadow": `${color}8C`, // ~55% Alpha
    "--rot": rotation,
  } as CSSProperties;

  return (
    <span className="planet-wrap" style={style}>
      {withOrbit && <span className="orbit" />}
      <img className="planet" src={mediaUrl(src)} alt={alt} width={size} height={size} />
      {sticker && (
        <span className="sticker" style={{ position: "absolute", top: -10, right: -18 }}>
          {sticker}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 6: `components/motion/MouseParallax.tsx`** (Planeten folgen sanft der Maus):

```tsx
"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export default function MouseParallax({ children, strength = 18 }: { children: ReactNode; strength?: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(useTransform(mx, [-0.5, 0.5], [-strength, strength]), { stiffness: 60, damping: 15 });
  const y = useSpring(useTransform(my, [-0.5, 0.5], [-strength, strength]), { stiffness: 60, damping: 15 });
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      style={{ x, y }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 7: Build** — `npm run build` → fehlerfrei (Komponenten noch unbenutzt).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Motion-Primitives (Reveal, Counter, WordReveal), Ticker und Planet-Komponente"
```

---

### Task 22: Buzzer mit Konfetti

**Files:**
- Create: `components/Buzzer.tsx`

- [ ] **Step 1: Komponente:**

```tsx
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
```

- [ ] **Step 2: Build** — grün. **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Buzzer-Komponente mit Konfetti und One-Linern"
```

---

### Task 23: Neue Startseite

**Files:**
- Modify (ersetzen): `app/page.tsx`
- Delete: `components/HomeHero.tsx` (und in `app/globals.css` dürfen die `.hero-layout-toggle`-Regeln entfernt werden)

- [ ] **Step 1: `app/page.tsx` komplett ersetzen:**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";
import Planet from "@/components/Planet";
import Buzzer from "@/components/Buzzer";
import Reveal from "@/components/motion/Reveal";
import Counter from "@/components/motion/Counter";
import WordReveal from "@/components/motion/WordReveal";
import MouseParallax from "@/components/motion/MouseParallax";
import { getActiveShows, getActiveOneLiners, getGalleryItems, getSiteMedia } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Steffen Vorholt – Comedy aus einer anderen Galaxie",
  description:
    "Drei Shows. Ein Host. Unendlich viele Lacher. Impro, Open Mic und Boarding-Comedy aus NRW – Termine, Tickets und Booking.",
};

const CLUSTER_POS = [
  { left: "4%", top: "4%", size: 180, rotation: "-3deg", orbit: true },
  { right: "4%", top: "34%", size: 125, rotation: "4deg", orbit: false },
  { left: "32%", bottom: "0%", size: 95, rotation: "-5deg", orbit: false },
];

export default async function HomePage() {
  const [shows, oneLiners, gallery, heroVideo] = await Promise.all([
    getActiveShows(),
    getActiveOneLiners(),
    getGalleryItems(),
    getSiteMedia("hero_video"),
  ]);

  return (
    <>
      <div className="shooting-star" aria-hidden="true" />
      <Ticker />

      {/* Hero */}
      <header className="container section hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="dot"></span> LIVE-COMEDY AUS NRW
          </div>
          <h1>
            <WordReveal text="Comedy aus einer anderen" />{" "}
            <em className="gradient" style={{ fontStyle: "italic" }}>
              <WordReveal text="Galaxie." />
            </em>
          </h1>
          <p className="lead">
            Drei Shows, ein Host: Steffen Vorholt bringt Impro, Open Mic und Boarding-Comedy auf die
            Bühnen von NRW.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/termine">
              🎟 Tickets sichern
            </Link>
            <Link className="btn secondary" href="/shows">
              Welche Show passt zu mir?
            </Link>
          </div>
          <div className="proof-row">
            <span>
              <Counter to={47} /> Shows gespielt
            </span>
            <span>
              <Counter to={6} /> Städte
            </span>
            <span>
              <Counter to={shows.length} /> eigene Formate
            </span>
          </div>
        </div>
        <MouseParallax>
          <div className="hero-cluster" aria-hidden="true">
            {shows.slice(0, 3).map((show, i) => {
              const pos = CLUSTER_POS[i];
              const { size, rotation, orbit, ...placement } = pos;
              return (
                <span className="cluster-item" style={placement} key={show.id}>
                  <Planet
                    src={show.planet_image_path}
                    alt=""
                    size={size}
                    color={show.color}
                    sticker={show.name}
                    rotation={rotation}
                    withOrbit={orbit}
                  />
                </span>
              );
            })}
          </div>
        </MouseParallax>
      </header>

      {/* Shows */}
      <section className="container section">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">🪐 Wähle deine Mission</div>
              <h2>Jede Show ein eigener Planet.</h2>
            </div>
            <p>Eigene Welt, eigene Farbe, eigener Humor – such dir aus, wo du landest.</p>
          </div>
        </Reveal>
        <div className="grid-3">
          {shows.map((show, i) => (
            <Reveal key={show.id} delay={i * 0.12}>
              <article className="card show-card">
                <div>
                  <div className="top">
                    <span className="badge">{show.name}</span>
                    <span className="badge">{show.format_label}</span>
                  </div>
                  <div className="show-art">
                    <Planet src={show.planet_image_path} alt={`Planet der Show ${show.name}`} size={150} color={show.color} />
                  </div>
                  <div className="show-card-copy">
                    <h3>{show.tagline}</h3>
                    <p>{show.description}</p>
                  </div>
                </div>
                <div className="actions">
                  <Link className="btn primary" href={`/shows/${show.slug}`}>
                    Show öffnen
                  </Link>
                  <Link className="btn secondary" href="/termine">
                    Tickets
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Nächste Termine */}
      <section className="container section">
        <Reveal>
          <div className="section-head">
            <div>
              <div className="eyebrow">🎟️ Nicht verpassen</div>
              <h2>Nächste Termine.</h2>
            </div>
            <p>Ticketlinks führen direkt zum externen Anbieter.</p>
          </div>
        </Reveal>
        <EventGrid limit={3} />
        <Reveal>
          <div className="actions">
            <Link className="btn primary" href="/termine">
              Alle Termine im Kalender
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Buzzer */}
      <section className="container section">
        <Reveal>
          <div className="section-head" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <div className="eyebrow">🔴 Wie bei Brain Loading</div>
              <h2>Du hast das Kommando.</h2>
            </div>
          </div>
          <Buzzer oneLiners={oneLiners.map((l) => l.text)} />
        </Reveal>
      </section>

      {/* Vergangene Missionen */}
      {gallery.length > 0 && (
        <section className="container section">
          <Reveal>
            <div className="section-head">
              <div>
                <div className="eyebrow">🛰️ Vergangene Missionen</div>
                <h2>Beweisfotos.</h2>
              </div>
              <p>Echte Bühnen, echtes Publikum, echte Lacher.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="gallery-grid">
              {gallery.map((g, i) => (
                <figure key={g.id} style={{ "--rot": `${(i % 3) - 1}deg` } as React.CSSProperties}>
                  <img src={mediaUrl(g.image_path)} alt={g.caption || "Showfoto"} loading="lazy" />
                  {g.caption && <figcaption>{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Steffen */}
      <section className="container section">
        <Reveal>
          <div className="feature">
            <div>
              <div className="eyebrow">👨‍🚀 Der Captain</div>
              <h2>Steffen Vorholt.</h2>
              <p>
                Comedian, Moderator und Veranstalter aus Neuss. Host von drei eigenen Formaten –
                und der Typ, der auf der Bühne auch dann weitermacht, wenn das Publikum Regie führt.
              </p>
              <div className="actions">
                <Link className="btn primary" href="/kontakt">
                  🎤 Steffen buchen
                </Link>
                <Link className="btn secondary" href="/kontakt#bewerben">
                  Als Comedian bewerben
                </Link>
              </div>
            </div>
            {heroVideo ? (
              <video
                src={mediaUrl(heroVideo)}
                autoPlay
                muted
                loop
                playsInline
                style={{ borderRadius: 24, border: "1px solid var(--line)" }}
              />
            ) : (
              <div className="media-placeholder">Bühnen-Video folgt</div>
            )}
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
```

- [ ] **Step 2: HomeHero entfernen**

```bash
rm components/HomeHero.tsx
grep -rn "HomeHero" app components   # Expected: keine Treffer
```

- [ ] **Step 3: Build + Sichtprüfung (gründlich)** — `npm run build`; Dev: Ticker läuft, Headline staggert, Planeten schweben + Sticker poppt beim Hover, Counter zählen beim Scrollen, Buzzer feuert Konfetti + One-Liner aus der DB, Galerie erscheint nur mit Inhalten. macOS: „Reduce Motion" in Systemeinstellungen testweise an → Dauerläufer stehen.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: neue Cosmic-Galaxie-Startseite mit Ticker, Planeten-Cluster, Countern und Buzzer"
```

---

### Task 24: Comedy-404 + Footer-Gag

**Files:**
- Create: `app/not-found.tsx`
- Modify: `components/Footer.tsx`

- [ ] **Step 1: `app/not-found.tsx`:**

```tsx
import Link from "next/link";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <section className="container section" style={{ textAlign: "center", minHeight: "60vh" }}>
        <div className="eyebrow">🛸 404 – Signal verloren</div>
        <h1>
          Diese Seite ist auf einem <em className="gradient" style={{ fontStyle: "italic" }}>anderen Planeten</em> gelandet.
        </h1>
        <p className="lead" style={{ margin: "18px auto 0" }}>
          Entweder hat sich der Link vertippt – oder Steffen hat die Seite in der zweiten Hälfte
          weggebuzzert. Kommt vor.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link className="btn primary" href="/">
            🚀 Zurück zur Erde
          </Link>
          <Link className="btn secondary" href="/termine">
            Direkt zu den Tickets
          </Link>
        </div>
      </section>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Footer-Gag** — in `components/Footer.tsx` ganz unten innerhalb des `<footer>` nach dem `.footer-grid`-div ergänzen:

```tsx
<div className="container" style={{ paddingBlock: "18px", color: "var(--muted)", fontSize: 13 }}>
  © {new Date().getFullYear()} Steffen Vorholt · Mit Liebe zur Pointe irgendwo zwischen Neuss und Andromeda gebaut.
</div>
```

- [ ] **Step 3: Build + Sichtprüfung** — `/gibt-es-nicht` zeigt die Comedy-404.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Comedy-404 und Footer-Schlusszeile"
```
