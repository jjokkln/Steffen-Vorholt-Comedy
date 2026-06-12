# Three.js + GSAP 2.5D Motion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Startseite erhaelt einen scrollgebundenen 2.5D-Hero mit Three.js-Planeten, GSAP-Scroll-Choreografie und hochwertige, wiederverwendbare Abschnittsuebergaenge.

**Architecture:** `app/page.tsx` bleibt Server Component und liefert serialisierbare Show-Daten an eine Client-Komponente. Three.js rendert nur die dekorative Hero-Szene; GSAP `ScrollTrigger` synchronisiert Canvas und semantischen DOM. Pure Pfadberechnungen leben frameworkfrei in `lib/motion/hero-paths.ts`, damit die Bewegungslogik test-first implementiert wird.

**Tech Stack:** Next.js 16, React 19, TypeScript, Three.js, GSAP, `@gsap/react`, native `node:test`, plain CSS.

**Design Spec:** `docs/superpowers/specs/2026-06-12-threejs-gsap-2-5d-motion-design.md`

---

## Dateistruktur

### Neu

- `lib/motion/hero-paths.ts` - deterministische Phasen, Keyframes und Interpolation
- `tests/hero-paths.test.ts` - Unit-Tests fuer die Pfadlogik
- `components/home/hero-types.ts` - gemeinsam verwendete Hero-Datentypen
- `components/home/HeroGalaxyScene.tsx` - Three.js-Renderer, Sprites, Sterne, Trail und Cleanup
- `components/home/HeroScrollExperience.tsx` - semantischer Hero, GSAP-Pinning und Fallback
- `components/home/SectionTransition.tsx` - GSAP-Transitions fuer Startseitenabschnitte

### Aendern

- `app/page.tsx` - neue Hero- und Transition-Komponenten integrieren
- `components/Buzzer.tsx` - GSAP-Energieimpuls und lokaler Shake
- `app/globals.css` - Hero-Layer, Canvas, Transitions, Responsive und Reduced Motion
- `package.json`, `package-lock.json` - Three.js/GSAP installieren, Framer Motion spaeter entfernen
- `README.md` - Motion-Stack und Performance-Verhalten dokumentieren

### Entfernen, wenn nach der Migration unreferenziert

- `components/motion/Counter.tsx`
- `components/motion/MouseParallax.tsx`
- `components/motion/Reveal.tsx`
- `components/motion/WordReveal.tsx`

---

### Task 1: Three.js- und GSAP-Abhaengigkeiten

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Laufzeit- und Typabhaengigkeiten installieren**

Run:

```bash
npm install three gsap @gsap/react
npm install -D @types/three
```

Expected: `package.json` enthaelt `three`, `gsap`, `@gsap/react` sowie `@types/three`.

- [ ] **Step 2: Bestehende Tests ausfuehren**

Run:

```bash
npm test
```

Expected: 14 Tests, 14 bestanden, 0 fehlgeschlagen.

- [ ] **Step 3: Produktionsbuild pruefen**

Run:

```bash
npm run build
```

Expected: Build erfolgreich; Three.js ist noch nicht in einer Route eingebunden.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: Three.js und GSAP fuer 2.5D-Motion"
```

---

### Task 2: Hero-Pfade test-first implementieren

**Files:**
- Create: `tests/hero-paths.test.ts`
- Create: `lib/motion/hero-paths.ts`

- [ ] **Step 1: Failing Tests schreiben**

Create `tests/hero-paths.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampProgress,
  getHeroSceneProfile,
  phaseForProgress,
  samplePlanetPose,
} from "../lib/motion/hero-paths.ts";

test("clampProgress begrenzt Werte auf 0 bis 1", () => {
  assert.equal(clampProgress(-0.4), 0);
  assert.equal(clampProgress(0.42), 0.42);
  assert.equal(clampProgress(1.8), 1);
});

test("samplePlanetPose liefert exakte Start- und Endwerte", () => {
  const path = getHeroSceneProfile("desktop", 1).paths[0];
  assert.deepEqual(samplePlanetPose(path, 0), path[0]);
  assert.deepEqual(samplePlanetPose(path, 1), path[path.length - 1]);
});

test("samplePlanetPose interpoliert deterministisch", () => {
  const pose = samplePlanetPose(
    [
      { at: 0, x: 0, y: 2, z: -2, scale: 1, rotation: 0, opacity: 0 },
      { at: 1, x: 4, y: -2, z: 2, scale: 3, rotation: 1, opacity: 1 },
    ],
    0.25,
  );
  assert.deepEqual(pose, {
    at: 0.25,
    x: 1,
    y: 1,
    z: -1,
    scale: 1.5,
    rotation: 0.25,
    opacity: 0.25,
  });
});

test("Desktop und Mobile liefern unterschiedliche gueltige Profile", () => {
  const desktop = getHeroSceneProfile("desktop", 3);
  const mobile = getHeroSceneProfile("mobile", 3);
  assert.equal(desktop.paths.length, 3);
  assert.equal(mobile.paths.length, 3);
  assert.equal(desktop.fov, 38);
  assert.notDeepEqual(desktop.paths, mobile.paths);
  assert.ok(desktop.starCount > mobile.starCount);
});

test("weniger Planeten reduzieren das Profil ohne ungueltige Pfade", () => {
  assert.equal(getHeroSceneProfile("desktop", 1).paths.length, 1);
  assert.equal(getHeroSceneProfile("desktop", 2).paths.length, 2);
  assert.equal(getHeroSceneProfile("desktop", 99).paths.length, 3);
  assert.equal(getHeroSceneProfile("desktop", 0).paths.length, 0);
});

test("phaseForProgress bildet die vier Choreografiephasen ab", () => {
  assert.equal(phaseForProgress(0.1), "arrival");
  assert.equal(phaseForProgress(0.4), "orbit");
  assert.equal(phaseForProgress(0.7), "portal");
  assert.equal(phaseForProgress(0.95), "landing");
});
```

- [ ] **Step 2: Test ausfuehren und erwarteten Fehler bestaetigen**

Run:

```bash
node --test tests/hero-paths.test.ts
```

Expected: FAIL mit `Cannot find module '../lib/motion/hero-paths.ts'`.

- [ ] **Step 3: Minimale Pfadimplementierung schreiben**

Create `lib/motion/hero-paths.ts`:

```ts
export type HeroMotionMode = "desktop" | "mobile";
export type HeroPhase = "arrival" | "orbit" | "portal" | "landing";

export interface PlanetPose {
  at: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface HeroSceneProfile {
  fov: number;
  dprCap: number;
  starCount: number;
  trailCount: number;
  paths: PlanetPose[][];
}

export const HERO_PHASES = {
  arrivalEnd: 0.18,
  orbitEnd: 0.58,
  portalEnd: 0.82,
} as const;

const DESKTOP_PATHS: PlanetPose[][] = [
  [
    { at: 0, x: 2.8, y: 1.6, z: -3.8, scale: 0.45, rotation: -0.16, opacity: 0 },
    { at: 0.18, x: 1.2, y: 0.8, z: -0.7, scale: 0.95, rotation: -0.05, opacity: 1 },
    { at: 0.42, x: 0.7, y: 0.25, z: 0.2, scale: 1.1, rotation: 0.06, opacity: 1 },
    { at: 0.58, x: 0.25, y: 0.15, z: 0.7, scale: 1.3, rotation: 0.12, opacity: 1 },
    { at: 0.72, x: -1.1, y: 0.05, z: 2.5, scale: 2.65, rotation: -0.1, opacity: 1 },
    { at: 0.82, x: -2.75, y: -0.2, z: 3.7, scale: 4.1, rotation: -0.2, opacity: 0.72 },
    { at: 1, x: -3.6, y: -2.05, z: 0.8, scale: 1.25, rotation: -0.28, opacity: 0 },
  ],
  [
    { at: 0, x: 4.1, y: 1.5, z: -4.4, scale: 0.38, rotation: 0.16, opacity: 0 },
    { at: 0.18, x: 2.45, y: 0.45, z: -1.2, scale: 0.72, rotation: 0.08, opacity: 1 },
    { at: 0.42, x: 2.2, y: 0.9, z: -0.2, scale: 0.82, rotation: -0.05, opacity: 1 },
    { at: 0.58, x: 2.7, y: 0.7, z: 0.15, scale: 0.88, rotation: -0.12, opacity: 1 },
    { at: 0.82, x: 3.1, y: -0.25, z: 0.65, scale: 1.08, rotation: 0.1, opacity: 0.9 },
    { at: 1, x: 2.9, y: -2.2, z: 0, scale: 0.92, rotation: 0.18, opacity: 0 },
  ],
  [
    { at: 0, x: 2.2, y: -1.8, z: -5, scale: 0.32, rotation: -0.22, opacity: 0 },
    { at: 0.18, x: 0.9, y: -0.9, z: -1.7, scale: 0.56, rotation: -0.12, opacity: 1 },
    { at: 0.42, x: 1.2, y: -0.65, z: -0.45, scale: 0.68, rotation: 0.04, opacity: 1 },
    { at: 0.58, x: 0.75, y: -1.05, z: 0.1, scale: 0.72, rotation: 0.12, opacity: 1 },
    { at: 0.82, x: 0.5, y: -1.25, z: 0.55, scale: 0.92, rotation: -0.08, opacity: 0.9 },
    { at: 1, x: 0.15, y: -2.25, z: 0, scale: 0.82, rotation: -0.16, opacity: 0 },
  ],
];

const MOBILE_PATHS: PlanetPose[][] = [
  [
    { at: 0, x: 1.2, y: 0.8, z: -2, scale: 0.6, rotation: -0.1, opacity: 0 },
    { at: 0.45, x: 0.7, y: 0.4, z: -0.3, scale: 0.9, rotation: 0, opacity: 1 },
    { at: 1, x: 0.25, y: 0.2, z: 0, scale: 1, rotation: 0.06, opacity: 1 },
  ],
  [
    { at: 0, x: 2.2, y: -0.1, z: -2.5, scale: 0.45, rotation: 0.14, opacity: 0 },
    { at: 0.55, x: 1.25, y: -0.15, z: -0.5, scale: 0.65, rotation: 0.04, opacity: 1 },
    { at: 1, x: 1.05, y: -0.25, z: 0, scale: 0.72, rotation: -0.04, opacity: 1 },
  ],
  [
    { at: 0, x: 0.5, y: -1.7, z: -3, scale: 0.36, rotation: -0.18, opacity: 0 },
    { at: 0.6, x: 0.25, y: -1, z: -0.6, scale: 0.52, rotation: -0.04, opacity: 1 },
    { at: 1, x: 0.1, y: -0.85, z: 0, scale: 0.6, rotation: 0.05, opacity: 1 },
  ],
];

export function clampProgress(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function phaseForProgress(value: number): HeroPhase {
  const progress = clampProgress(value);
  if (progress < HERO_PHASES.arrivalEnd) return "arrival";
  if (progress < HERO_PHASES.orbitEnd) return "orbit";
  if (progress < HERO_PHASES.portalEnd) return "portal";
  return "landing";
}

export function samplePlanetPose(path: PlanetPose[], value: number): PlanetPose {
  if (!path.length) throw new Error("Planet path must contain at least one keyframe.");
  const progress = clampProgress(value);
  if (progress <= path[0].at) return { ...path[0] };
  if (progress >= path[path.length - 1].at) return { ...path[path.length - 1] };

  const nextIndex = path.findIndex((frame) => frame.at >= progress);
  const start = path[nextIndex - 1];
  const end = path[nextIndex];
  const local = (progress - start.at) / (end.at - start.at);
  const lerp = (from: number, to: number) => from + (to - from) * local;

  return {
    at: progress,
    x: lerp(start.x, end.x),
    y: lerp(start.y, end.y),
    z: lerp(start.z, end.z),
    scale: lerp(start.scale, end.scale),
    rotation: lerp(start.rotation, end.rotation),
    opacity: lerp(start.opacity, end.opacity),
  };
}

export function getHeroSceneProfile(
  mode: HeroMotionMode,
  planetCount: number,
): HeroSceneProfile {
  const count = Math.min(3, Math.max(0, Math.floor(planetCount)));
  const desktop = mode === "desktop";
  return {
    fov: 38,
    dprCap: desktop ? 1.75 : 1.25,
    starCount: desktop ? 120 : 48,
    trailCount: desktop ? 24 : 0,
    paths: (desktop ? DESKTOP_PATHS : MOBILE_PATHS)
      .slice(0, count)
      .map((path) => path.map((frame) => ({ ...frame }))),
  };
}
```

- [ ] **Step 4: Unit-Test erneut ausfuehren**

Run:

```bash
node --test tests/hero-paths.test.ts
```

Expected: 6 Tests bestanden.

- [ ] **Step 5: Gesamte Testsuite ausfuehren**

Run:

```bash
npm test
```

Expected: 20 Tests bestanden, 0 fehlgeschlagen.

- [ ] **Step 6: Commit**

```bash
git add lib/motion/hero-paths.ts tests/hero-paths.test.ts
git commit -m "feat: testbare Pfadlogik fuer 2.5D-Hero"
```

---

### Task 3: Three.js-Hero-Szene

**Files:**
- Create: `components/home/hero-types.ts`
- Create: `components/home/HeroGalaxyScene.tsx`

- [ ] **Step 1: Gemeinsame Typen anlegen**

Create `components/home/hero-types.ts`:

```ts
export type HeroPlanetRole = "primary" | "secondary" | "tertiary";

export interface HeroPlanet {
  id: string;
  slug: string;
  name: string;
  color: string;
  imageUrl: string;
  role: HeroPlanetRole;
}

export interface HeroMotionState {
  progress: number;
  pointerX: number;
  pointerY: number;
}
```

- [ ] **Step 2: Three.js-Szene implementieren**

Create `components/home/HeroGalaxyScene.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { HeroMotionState, HeroPlanet } from "@/components/home/hero-types";
import { getHeroSceneProfile, samplePlanetPose } from "@/lib/motion/hero-paths";

interface HeroGalaxySceneProps {
  planets: HeroPlanet[];
  motionState: MutableRefObject<HeroMotionState>;
  stickerRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
  onReady: () => void;
  onFallback: () => void;
}

export default function HeroGalaxyScene({
  planets,
  motionState,
  stickerRefs,
  onReady,
  onFallback,
}: HeroGalaxySceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !planets.length) return;

    let disposed = false;
    let failed = false;
    let cleanupScene: (() => void) | undefined;

    const init = async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.className = "hero-galaxy-canvas";
        renderer.domElement.setAttribute("aria-hidden", "true");
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
        camera.position.set(0, 0, 8);
        const spriteEntries: Array<{
          planet: HeroPlanet;
          texture: import("three").Texture;
          material: import("three").SpriteMaterial;
          sprite: import("three").Sprite;
          aspect: number;
          projected: import("three").Vector3;
        }> = [];
        let rendererDisposed = false;

        const disposeRenderer = () => {
          if (rendererDisposed) return;
          rendererDisposed = true;
          renderer.setAnimationLoop(null);
          spriteEntries.forEach(({ sprite, texture, material }) => {
            scene.remove(sprite);
            texture.dispose();
            material.dispose();
          });
          scene.clear();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
        };
        cleanupScene = disposeRenderer;

        let profile = getHeroSceneProfile(
          window.matchMedia("(min-width: 901px)").matches ? "desktop" : "mobile",
          planets.length,
        );

        const loader = new THREE.TextureLoader();
        await Promise.all(
          planets.map(async (planet, index) => {
            const texture = await loader.loadAsync(planet.imageUrl);
            if (disposed || failed) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            const image = texture.image as { width?: number; height?: number };
            const aspect = (image.width || 1) / (image.height || 1);
            const material = new THREE.SpriteMaterial({
              map: texture,
              color: 0xffffff,
              transparent: true,
              depthTest: true,
              depthWrite: false,
              toneMapped: false,
            });
            const sprite = new THREE.Sprite(material);
            scene.add(sprite);
            spriteEntries[index] = {
              planet,
              texture,
              material,
              sprite,
              aspect,
              projected: new THREE.Vector3(),
            };
          }),
        );

        if (disposed || failed) {
          cleanupScene?.();
          return;
        }

        const seedRandom = (() => {
          let seed = 173;
          return () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
          };
        })();

        const starPositions = new Float32Array(120 * 3);
        for (let i = 0; i < 120; i += 1) {
          starPositions[i * 3] = (seedRandom() - 0.5) * 12;
          starPositions[i * 3 + 1] = (seedRandom() - 0.5) * 7;
          starPositions[i * 3 + 2] = -1 - seedRandom() * 7;
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        const starMaterial = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.028,
          transparent: true,
          opacity: 0.54,
          depthWrite: false,
        });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        const primaryIndex = Math.max(
          0,
          planets.findIndex((planet) => planet.role === "primary"),
        );
        const trailPositions = new Float32Array(24 * 3);
        const trailGeometry = new THREE.BufferGeometry();
        trailGeometry.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
        const trailMaterial = new THREE.PointsMaterial({
          color: new THREE.Color(planets[primaryIndex]?.color || "#7CFF6B"),
          size: 0.085,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const trail = new THREE.Points(trailGeometry, trailMaterial);
        scene.add(trail);

        const pointer = { x: 0, y: 0 };
        let inView = true;
        let documentVisible = !document.hidden;

        const resize = () => {
          const width = Math.max(1, mount.clientWidth);
          const height = Math.max(1, mount.clientHeight);
          const mode = width >= 901 ? "desktop" : "mobile";
          profile = getHeroSceneProfile(mode, planets.length);
          starGeometry.setDrawRange(0, profile.starCount);
          trailGeometry.setDrawRange(0, profile.trailCount);
          camera.fov = profile.fov;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.dprCap));
          renderer.setSize(width, height, false);
        };

        const render = () => {
          const progress = motionState.current.progress;
          pointer.x += (motionState.current.pointerX - pointer.x) * 0.08;
          pointer.y += (motionState.current.pointerY - pointer.y) * 0.08;

          spriteEntries.forEach((entry, index) => {
            const path = profile.paths[index];
            if (!path) return;
            const pose = samplePlanetPose(path, progress);
            const pointerWeight = index === primaryIndex ? 0.28 : 0.16;
            entry.sprite.position.set(
              pose.x + pointer.x * pointerWeight,
              pose.y - pointer.y * pointerWeight,
              pose.z,
            );
            entry.sprite.scale.set(
              1.75 * entry.aspect * pose.scale,
              1.75 * pose.scale,
              1,
            );
            entry.material.rotation = pose.rotation;
            entry.material.opacity = pose.opacity;

            const label = stickerRefs.current[entry.planet.id];
            if (label) {
              entry.projected.copy(entry.sprite.position).project(camera);
              const x = (entry.projected.x * 0.5 + 0.5) * mount.clientWidth;
              const y = (-entry.projected.y * 0.5 + 0.5) * mount.clientHeight;
              const visible =
                Math.abs(entry.projected.z) <= 1 && pose.opacity > 0.08 && progress < 0.88;
              label.style.opacity = visible ? String(Math.min(1, pose.opacity)) : "0";
              label.style.transform =
                `translate3d(${x}px, ${y}px, 0) translate(-50%, -135%) ` +
                `rotate(${pose.rotation * 57.2958}deg)`;
            }
          });

          const portalIn = Math.min(1, Math.max(0, (progress - 0.58) / 0.14));
          const portalOut = Math.min(1, Math.max(0, (progress - 0.82) / 0.12));
          trailMaterial.opacity = portalIn * (1 - portalOut) * 0.78;

          if (profile.trailCount && profile.paths[primaryIndex]) {
            const primaryPose = samplePlanetPose(profile.paths[primaryIndex], progress);
            for (let i = 0; i < profile.trailCount; i += 1) {
              const offset = i / Math.max(1, profile.trailCount - 1);
              trailPositions[i * 3] = primaryPose.x + offset * 2.2;
              trailPositions[i * 3 + 1] =
                primaryPose.y + Math.sin(offset * Math.PI * 3) * 0.08;
              trailPositions[i * 3 + 2] = primaryPose.z - offset * 0.45;
            }
            const position = trailGeometry.getAttribute("position");
            position.needsUpdate = true;
          }

          stars.rotation.z = progress * 0.05;
          stars.position.x = pointer.x * -0.08;
          stars.position.y = pointer.y * 0.06;
          camera.position.x = portalIn * -0.28;
          camera.position.z = 8 - portalIn * 0.42;
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
        };

        const syncLoop = () => {
          renderer.setAnimationLoop(!disposed && inView && documentVisible ? render : null);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();

        const intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
            syncLoop();
          },
          { threshold: 0.01 },
        );
        intersectionObserver.observe(mount);

        const handleVisibility = () => {
          documentVisible = !document.hidden;
          syncLoop();
        };
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          renderer.setAnimationLoop(null);
          onFallback();
        };

        document.addEventListener("visibilitychange", handleVisibility);
        renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

        render();
        onReady();
        syncLoop();

        cleanupScene = () => {
          renderer.setAnimationLoop(null);
          resizeObserver.disconnect();
          intersectionObserver.disconnect();
          document.removeEventListener("visibilitychange", handleVisibility);
          renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
          starGeometry.dispose();
          starMaterial.dispose();
          trailGeometry.dispose();
          trailMaterial.dispose();
          disposeRenderer();
        };
      } catch (error) {
        failed = true;
        cleanupScene?.();
        if (!disposed) {
          console.warn("[hero-galaxy] WebGL-Szene deaktiviert:", error);
          onFallback();
        }
      }
    };

    void init();
    return () => {
      disposed = true;
      cleanupScene?.();
    };
  }, [motionState, onFallback, onReady, planets, stickerRefs]);

  return <div className="hero-galaxy-mount" ref={mountRef} aria-hidden="true" />;
}
```

- [ ] **Step 3: TypeScript-Build pruefen**

Run:

```bash
npm run build
```

Expected: Build erfolgreich; die neue Szene ist noch unbenutzt.

- [ ] **Step 4: Commit**

```bash
git add components/home/hero-types.ts components/home/HeroGalaxyScene.tsx
git commit -m "feat: Three.js-Sprite-Szene fuer Hero"
```

---

### Task 4: GSAP-gesteuerte Hero Experience

**Files:**
- Create: `components/home/HeroScrollExperience.tsx`

- [ ] **Step 1: Hero-Komponente implementieren**

Create `components/home/HeroScrollExperience.tsx`:

```tsx
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
  const stickerRefs = useRef<Record<string, HTMLSpanElement | null>>({});
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

          if (conditions.desktop) {
            gsap.timeline({
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: () => `+=${Math.round(window.innerHeight * 1.5)}`,
                pin: true,
                scrub: 0.9,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  motionState.current.progress = self.progress;
                },
              },
            })
              .to("[data-scroll-cue]", { autoAlpha: 0, y: 12, duration: 0.12 }, 0.08)
              .to("[data-hero-copy]", { xPercent: -8, opacity: 0.42, ease: "none" }, 0.58)
              .to(root, { "--hero-portal": 1, ease: "none" }, 0.58)
              .to("[data-hero-copy]", { xPercent: -16, opacity: 0, ease: "none" }, 0.82);
          } else {
            motionState.current.progress = 1;
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

        <div className="hero-visual-stage">
          {sceneEnabled && (
            <HeroGalaxyScene
              planets={planets}
              motionState={motionState}
              stickerRefs={stickerRefs}
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
                planet.role === "primary" ? 190 : planet.role === "secondary" ? 132 : 104;
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
                  <span className="sticker" style={{ position: "absolute", top: -10, right: -18 }}>
                    {planet.name}
                  </span>
                </span>
              );
            })}
          </div>

          <div className={`hero-webgl-labels${sceneReady ? " is-ready" : ""}`} aria-hidden="true">
            {planets.map((planet) => (
              <span
                className="sticker hero-webgl-label"
                key={planet.id}
                ref={(element) => {
                  stickerRefs.current[planet.id] = element;
                }}
                style={{ "--sticker-shadow": `${planet.color}8C` } as CSSProperties}
              >
                {planet.name}
              </span>
            ))}
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
```

Der native `<img>`-Fallback ist hier beabsichtigt: Three.js und die sofort sichtbare
Fallback-Schicht verwenden dadurch dieselbe Original-URL und teilen sich den HTTP-Cache.
Die normalen Inhaltsbilder der Show-Karten bleiben weiterhin `next/image`.

- [ ] **Step 2: Build der unbenutzten Hero-Komponente pruefen**

Run:

```bash
npm run build
```

Expected: Build erfolgreich.

- [ ] **Step 3: Commit**

```bash
git add components/home/HeroScrollExperience.tsx
git commit -m "feat: GSAP ScrollTrigger Hero-Choreografie"
```

---

### Task 5: Wiederverwendbare Abschnittsuebergaenge und Buzzer-Impuls

**Files:**
- Create: `components/home/SectionTransition.tsx`
- Modify: `components/Buzzer.tsx`

- [ ] **Step 1: SectionTransition implementieren**

Create `components/home/SectionTransition.tsx`:

```tsx
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
```

- [ ] **Step 2: Buzzer auf GSAP umstellen**

Replace `components/Buzzer.tsx`:

```tsx
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
      <span className="buzzer-energy" aria-hidden="true" />
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

- [ ] **Step 3: Build pruefen**

Run:

```bash
npm run build
```

Expected: Build erfolgreich.

- [ ] **Step 4: Commit**

```bash
git add components/home/SectionTransition.tsx components/Buzzer.tsx
git commit -m "feat: GSAP Abschnittsuebergaenge und Buzzer-Impuls"
```

---

### Task 6: Startseite auf das neue Motion-System umstellen

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Startseite vollstaendig ersetzen**

Replace `app/page.tsx`:

```tsx
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import EventGrid from "@/components/EventGrid";
import Footer from "@/components/Footer";
import Ticker from "@/components/Ticker";
import Planet from "@/components/Planet";
import Buzzer from "@/components/Buzzer";
import HeroScrollExperience from "@/components/home/HeroScrollExperience";
import SectionTransition from "@/components/home/SectionTransition";
import type { HeroPlanetRole } from "@/components/home/hero-types";
import JsonLd from "@/components/JsonLd";
import { getActiveShows, getActiveOneLiners, getGalleryItems, getSiteMedia } from "@/lib/data";
import { personJsonLd } from "@/lib/jsonld";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Steffen Vorholt – Comedy aus einer anderen Galaxie",
  description:
    "Drei Shows. Ein Host. Unendlich viele Lacher. Impro, Open Mic und Boarding-Comedy aus NRW – Termine, Tickets und Booking.",
};

const HERO_ROLES: HeroPlanetRole[] = ["primary", "secondary", "tertiary"];

export default async function HomePage() {
  const [shows, oneLiners, gallery, heroVideo] = await Promise.all([
    getActiveShows(),
    getActiveOneLiners(),
    getGalleryItems(),
    getSiteMedia("hero_video"),
  ]);

  const heroShows = [...shows]
    .filter((show) => show.planet_image_path)
    .sort((a, b) => {
      if (a.slug === "brain-loading") return -1;
      if (b.slug === "brain-loading") return 1;
      return a.sort_order - b.sort_order;
    })
    .slice(0, 3);

  const heroPlanets = heroShows.map((show, index) => ({
    id: show.id,
    slug: show.slug,
    name: show.name,
    color: show.color,
    imageUrl: mediaUrl(show.planet_image_path),
    role: HERO_ROLES[index],
  }));

  return (
    <>
      <Ticker />
      <HeroScrollExperience
        planets={heroPlanets}
        showCount={47}
        cityCount={6}
        formatCount={shows.length}
      />

      <SectionTransition variant="cards">
        <section className="container section home-shows-section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Wähl deine Mission</div>
              <h2>Jede Show ein eigener Planet.</h2>
            </div>
            <p>Eigene Welt, eigene Farbe, eigener Humor – such dir aus, wo du landest.</p>
          </div>
          <div className="grid-3">
            {shows.map((show) => (
              <article className="card show-card" key={show.id}>
                <div>
                  <div className="top">
                    <span className="badge">{show.name}</span>
                    <span className="badge">{show.format_label}</span>
                  </div>
                  <div className="show-art">
                    <Planet
                      src={show.planet_image_path}
                      alt={`Planet der Show ${show.name}`}
                      size={150}
                      color={show.color}
                    />
                  </div>
                  <div className="show-card-copy">
                    <h3>{show.tagline}</h3>
                    <p>{show.description}</p>
                  </div>
                </div>
                <div className="actions">
                  <Link className="btn primary" href={`/shows/${show.slug}`}>Show öffnen</Link>
                  <Link className="btn secondary" href="/termine">Tickets</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </SectionTransition>

      <SectionTransition variant="track">
        <section className="container section home-events-section">
          <div className="section-head">
            <div>
              <div className="eyebrow">Nicht verpassen</div>
              <h2>Nächste Termine.</h2>
            </div>
            <p>Ticketlinks führen direkt zum externen Anbieter.</p>
          </div>
          <EventGrid limit={3} />
          <div className="actions">
            <Link className="btn primary" href="/termine">Alle Termine im Kalender</Link>
          </div>
        </section>
      </SectionTransition>

      <SectionTransition variant="reveal">
        <section className="container section home-buzzer-section">
          <div className="section-head" style={{ justifyContent: "center", textAlign: "center" }}>
            <div>
              <div className="eyebrow">Wie bei Brain Loading</div>
              <h2>Du hast das Kommando.</h2>
            </div>
          </div>
          <Buzzer oneLiners={oneLiners.map((line) => line.text)} />
        </section>
      </SectionTransition>

      {gallery.length > 0 && (
        <SectionTransition variant="archive">
          <section className="container section home-gallery-section">
            <div className="section-head">
              <div>
                <div className="eyebrow">Vergangene Missionen</div>
                <h2>Beweisfotos.</h2>
              </div>
              <p>Echte Bühnen, echtes Publikum, echte Lacher.</p>
            </div>
            <div className="gallery-grid">
              {gallery.map((item, index) => (
                <figure
                  key={item.id}
                  style={{ "--rot": `${(index % 3) - 1}deg` } as CSSProperties}
                >
                  <Image
                    src={mediaUrl(item.image_path)}
                    alt={item.caption || "Showfoto"}
                    width={800}
                    height={600}
                    style={{ width: "100%", height: 220, objectFit: "cover" }}
                  />
                  {item.caption && <figcaption>{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        </SectionTransition>
      )}

      <SectionTransition variant="reveal">
        <section className="container section home-captain-section">
          <div className="feature">
            <div>
              <div className="eyebrow">Der Captain</div>
              <h2>Steffen Vorholt.</h2>
              <p>
                Comedian, Moderator und Veranstalter aus Neuss. Host von drei eigenen Formaten –
                und der Typ, der auf der Bühne auch dann weitermacht, wenn das Publikum Regie führt.
              </p>
              <div className="actions">
                <Link className="btn primary" href="/kontakt">Steffen buchen</Link>
                <Link className="btn secondary" href="/kontakt#bewerben">Als Comedian bewerben</Link>
              </div>
            </div>
            <div className="captain-media">
              {heroVideo ? (
                <video
                  src={mediaUrl(heroVideo)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ) : (
                <div className="media-placeholder">Bühnen-Video folgt</div>
              )}
            </div>
          </div>
        </section>
      </SectionTransition>

      <JsonLd data={personJsonLd()} />
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Build pruefen**

Run:

```bash
npm run build
```

Expected: Build erfolgreich; die Startseite referenziert keine alten Motion-Komponenten mehr.

- [ ] **Step 3: Referenzen pruefen**

Run:

```bash
rg -n "Reveal|WordReveal|MouseParallax|Counter" app components
```

Expected: Treffer nur noch in den vier alten Dateien unter `components/motion/`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: Startseite auf 2.5D-Hero und GSAP-Transitions umstellen"
```

---

### Task 7: Hero-, Transition- und Reduced-Motion-CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Tote Alt-CSS-Bloecke entfernen**

Delete these complete selector groups from `app/globals.css`:

```text
.home-hero
.hero-layout-toggle and all descendants
.stage
.stage-card and all descendants
.home-hero.is-full-video and all descendants
.s1
.s2
.s3
@keyframes bob
desktop/mobile responsive rules that only target the removed selectors
.hero-cluster
.hero-cluster .cluster-item
.shooting-star
@keyframes shoot
```

Keep `.hero`, because `app/shows/[slug]/page.tsx` still uses it.

- [ ] **Step 2: Neue Hero- und Transition-Regeln anhaengen**

Append to `app/globals.css`:

```css
/* === 2.5D Hero + GSAP Transitions === */
.hero-scroll-shell{
  --hero-portal:0;
  position:relative;
  min-height:calc(100vh - 84px);
  overflow:hidden;
  isolation:isolate;
  background:
    radial-gradient(circle at 22% 32%,rgba(155,92,255,.3),transparent 32%),
    radial-gradient(circle at 82% 42%,rgba(66,217,255,.16),transparent 34%);
}
.hero-portal-glow{
  position:absolute;inset:-25%;z-index:-1;pointer-events:none;
  opacity:calc(.08 + var(--hero-portal)*.76);
  transform:scale(calc(.7 + var(--hero-portal)*.55));
  background:
    radial-gradient(circle at 48% 52%,rgba(124,255,107,.35),transparent 18%),
    radial-gradient(circle at 56% 48%,rgba(66,217,255,.28),transparent 32%),
    radial-gradient(circle at 46% 52%,rgba(155,92,255,.3),transparent 48%);
}
.hero-scroll-grid{
  min-height:calc(100vh - 84px);
  display:grid;grid-template-columns:minmax(0,.92fr) minmax(460px,1.08fr);
  gap:clamp(28px,5vw,82px);align-items:center;padding-block:clamp(64px,8vw,118px);
}
.hero-scroll-copy{position:relative;z-index:6;will-change:transform,opacity}
.hero-scroll-title{display:grid;gap:.02em}
.hero-line-mask{display:block;overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}
.hero-line-mask>span,.hero-line-mask>em{display:block;width:max-content;max-width:100%}
.hero-visual-stage{position:relative;min-height:560px;z-index:3}
.hero-galaxy-mount,.hero-static-fallback,.hero-webgl-labels{
  position:absolute;inset:0
}
.hero-galaxy-mount{z-index:2;pointer-events:none}
.hero-galaxy-canvas{width:100%;height:100%;display:block;pointer-events:none}
.hero-static-fallback{
  z-index:1;transition:opacity .45s ease,visibility .45s ease;pointer-events:none
}
.hero-static-fallback.is-hidden{opacity:0;visibility:hidden}
.hero-fallback-planet{position:absolute}
.hero-fallback-planet.is-primary{left:13%;top:14%}
.hero-fallback-planet.is-secondary{right:2%;top:42%}
.hero-fallback-planet.is-tertiary{left:42%;bottom:4%}
.hero-webgl-labels{z-index:4;opacity:0;transition:opacity .35s ease;pointer-events:none}
.hero-webgl-labels.is-ready{opacity:1}
.hero-webgl-label{
  position:absolute;left:0;top:0;will-change:transform,opacity;opacity:0;white-space:nowrap
}
.hero-scroll-cue{
  position:absolute;left:50%;bottom:18px;z-index:8;translate:-50% 0;
  display:grid;justify-items:center;gap:8px;color:var(--muted);
  font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase
}
.hero-scroll-cue i{
  display:block;width:1px;height:34px;transform-origin:top;
  background:linear-gradient(var(--gold1),transparent);animation:scroll-cue 1.5s ease-in-out infinite
}
@keyframes scroll-cue{50%{transform:scaleY(.45);opacity:.45}}

.section-transition{position:relative;isolation:isolate}
.section-transition.is-track{overflow:hidden}
.section-light-track{
  position:absolute;z-index:-1;left:5%;right:5%;top:48%;height:2px;transform-origin:left;
  background:linear-gradient(90deg,transparent,var(--gold1),var(--blue),transparent);
  box-shadow:0 0 30px rgba(66,217,255,.48);opacity:0
}
.home-shows-section{position:relative}
.home-events-section{position:relative}
.home-buzzer-section{position:relative}
.buzzer-zone{position:relative}
.buzzer-energy{
  position:absolute;width:180px;height:180px;border-radius:50%;pointer-events:none;
  border:2px solid rgba(124,255,107,.75);
  box-shadow:0 0 46px rgba(66,217,255,.42),inset 0 0 34px rgba(255,79,216,.28);
  opacity:0
}
.captain-media{overflow:hidden;border-radius:24px;border:1px solid var(--line)}
.captain-media video{width:100%;height:100%;object-fit:cover}

@media(max-width:900px){
  .hero-scroll-shell{min-height:auto}
  .hero-scroll-grid{
    min-height:auto;grid-template-columns:1fr;padding-block:clamp(72px,12vw,110px)
  }
  .hero-visual-stage{min-height:430px}
  .hero-scroll-cue{display:none}
  .hero-fallback-planet.is-primary{left:8%;top:6%}
  .hero-fallback-planet.is-secondary{right:4%;top:38%}
  .hero-fallback-planet.is-tertiary{left:38%;bottom:0}
}
@media(max-width:680px){
  .hero-scroll-title{font-size:48px}
  .hero-visual-stage{min-height:340px}
  .hero-fallback-planet.is-primary{left:3%;top:4%;transform:scale(.8)}
  .hero-fallback-planet.is-secondary{right:-4%;top:40%;transform:scale(.76)}
  .hero-fallback-planet.is-tertiary{left:32%;bottom:-6%;transform:scale(.76)}
}
```

- [ ] **Step 3: Reduced Motion vollstaendig ersetzen**

Replace the existing `@media (prefers-reduced-motion: reduce)` block with:

```css
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  body:before,
  .ticker-track,
  .planet,
  .sticker,
  .dot,
  .calendar-event,
  .hero-scroll-cue i{
    animation:none!important
  }
  .hero-static-fallback,
  .hero-webgl-labels,
  .section-transition,
  .section-transition *,
  .buzzer-zone{
    transition:none!important
  }
  .hero-webgl-labels{display:none}
  .hero-static-fallback{opacity:1!important;visibility:visible!important}
}
```

- [ ] **Step 4: Build und CSS-Referenzen pruefen**

Run:

```bash
npm run build
rg -n "home-hero|hero-layout-toggle|stage-card|shooting-star|hero-cluster" app components
```

Expected: Build erfolgreich; `rg` liefert keine Treffer.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: 2.5D-Hero-Layout und responsive Motion-Styles"
```

---

### Task 8: Framer Motion entfernen und Dokumentation aktualisieren

**Files:**
- Delete: `components/motion/Counter.tsx`
- Delete: `components/motion/MouseParallax.tsx`
- Delete: `components/motion/Reveal.tsx`
- Delete: `components/motion/WordReveal.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`

- [ ] **Step 1: Sicherstellen, dass keine Framer-Imports verbleiben**

Run:

```bash
rg -n "framer-motion|components/motion" app components lib tests
```

Expected: Treffer ausschliesslich in den vier zu loeschenden Dateien.

- [ ] **Step 2: Alte Motion-Komponenten und Paket entfernen**

Run:

```bash
rm components/motion/Counter.tsx \
  components/motion/MouseParallax.tsx \
  components/motion/Reveal.tsx \
  components/motion/WordReveal.tsx
rmdir components/motion
npm uninstall framer-motion
```

- [ ] **Step 3: README-Stack aktualisieren**

In `README.md`, replace:

```markdown
- framer-motion + canvas-confetti für Motion (respektiert `prefers-reduced-motion`)
```

with:

```markdown
- Three.js + GSAP ScrollTrigger für den scrollgebundenen 2.5D-Hero und Abschnittsübergänge
- canvas-confetti für den Buzzer; alle Motion-Pfade respektieren `prefers-reduced-motion`
```

Add below the SEO section:

```markdown
## Motion & Performance

Die Startseite lädt Three.js nur clientseitig für den Hero. Desktop nutzt eine angeheftete,
scrollgebundene 2.5D-Sequenz; Mobile und `prefers-reduced-motion` erhalten eine reduzierte,
nicht angeheftete bzw. statische Variante. Der WebGL-Renderer pausiert außerhalb des Hero-Bereichs.
```

- [ ] **Step 4: Gesamte Testsuite und Build ausfuehren**

Run:

```bash
npm test
npm run build
```

Expected: 20 Tests bestanden; Produktionsbuild erfolgreich.

- [ ] **Step 5: Verwaiste Referenzen ausschliessen**

Run:

```bash
rg -n "framer-motion|components/motion|Reveal|WordReveal|MouseParallax|Counter" \
  app components lib tests package.json
```

Expected: keine Treffer.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Framer Motion durch Three.js und GSAP ersetzen"
```

---

### Task 9: Production-Browser-, Fallback- und Performance-Abnahme

**Files:**
- Modify only if a verification failure requires a targeted fix.

- [ ] **Step 1: Frische Gesamtverifikation**

Run:

```bash
npm test && npm run build
```

Expected: 20 Tests bestanden; Build erfolgreich.

- [ ] **Step 2: Production-Server starten**

Run:

```bash
npm run start -- --port 3001
```

Expected: `Ready` auf `http://localhost:3001`.

- [ ] **Step 3: Kernrouten pruefen**

Run in a second terminal:

```bash
for route in / /shows /termine /kontakt /sitemap.xml /robots.txt; do
  curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" "http://localhost:3001$route"
done
```

Expected: alle Routen liefern `200`.

- [ ] **Step 4: Server-gerenderten Fallback pruefen**

Run:

```bash
curl -s http://localhost:3001/ > /tmp/steffen-home-ssr.html
rg -n "Comedy aus einer|Tickets sichern|hero-static-fallback|<img" /tmp/steffen-home-ssr.html
```

Expected: Headline, CTA und statische Planetenkomposition stehen bereits im HTML, bevor
Client-JavaScript oder WebGL ausgefuehrt wird.

- [ ] **Step 5: Desktop-Choreografie im Browser pruefen**

Prefer the Browser Use plugin against `http://localhost:3001/`. If its Node-REPL tool is unavailable, use the existing approved headless-Chrome workflow.

Verify:

1. Hero ist bei 1440 px Breite gepinnt.
2. Scrollen bewegt Planeten auf unterschiedlichen Tiefenebenen.
3. Brain Loading durchlaeuft den Portal-Flug.
4. Am Ende erscheinen Show-Karten ohne sichtbaren Sprung.
5. Canvas liegt hinter DOM und blockiert keine Links.
6. Browser-Konsole enthaelt keine Errors.

- [ ] **Step 6: Mobile-Variante pruefen**

Viewport: `390x844`.

Verify:

1. Kein Pinning.
2. Kein horizontaler Overflow.
3. Headline, CTAs und alle drei Planeten sind sichtbar.
4. Navigation und weitere Abschnitte bleiben bedienbar.

- [ ] **Step 7: Reduced-Motion pruefen**

Use Chrome with forced reduced motion or enable the OS setting.

Verify:

1. Kein WebGL-Canvas-Renderloop.
2. Kein Hero-Pinning.
3. Ticker, Planeten, Sticker, Live-Dot, Sterne und Kalenderpuls stehen still.
4. Alle Inhalte sind sofort sichtbar.

- [ ] **Step 8: WebGL-Fallback pruefen**

Start Chrome with WebGL disabled:

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new \
  --disable-webgl \
  --disable-gpu \
  --window-size=1440,1100 \
  --screenshot=/tmp/steffen-webgl-fallback.png \
  http://localhost:3001/
```

Expected: statische Planetenkomposition, lesbare Headline und funktionsfaehige CTAs.

- [ ] **Step 9: Lighthouse ausfuehren**

Run:

```bash
npx --yes lighthouse http://localhost:3001/ \
  --only-categories=performance,seo \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json \
  --output-path=/tmp/steffen-motion-lighthouse.json
node -e "const r=require('/tmp/steffen-motion-lighthouse.json'); console.log({performance:r.categories.performance.score*100,seo:r.categories.seo.score*100})"
```

Expected:

```text
performance >= 90
seo >= 90
```

If a score is below 90, fix the largest measured regression only, then rerun Task 9 Step 1 and Step 9.

- [ ] **Step 10: Finalen Git-Stand pruefen**

Run:

```bash
git status --short --branch
git log -8 --oneline
```

Expected: sauberer Working Tree. Wenn Step 9 einen Fix erforderte:

```bash
git add -A
git commit -m "perf: 2.5D-Hero fuer Production optimieren"
```
