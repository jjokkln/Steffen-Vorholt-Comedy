"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-weiter Galaxy-Hintergrund (Three.js), fixed hinter `.page`.
 * Progressive Enhancement: ohne WebGL / bei Reduced Motion / Save-Data bleibt
 * der CSS-Gradient + Punktraster aus globals.css vollständig bestehen — der
 * Canvas blendet erst nach dem ersten gerenderten Frame ein (`.is-live`).
 * Rein dekorativ: aria-hidden, pointer-events:none, pausiert bei verstecktem Tab.
 */
export default function GalaxyBackground() {
  const pathname = usePathname();
  const mountRef = useRef<HTMLDivElement>(null);
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || isAdmin) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    if (reduced.matches || saveData) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "high-performance",
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 60);
        camera.position.set(0, 0, 8);

        const mobile = window.innerWidth < 901;
        const STAR_COUNT = mobile ? 520 : 1500;
        const NEBULA_COUNT = mobile ? 4 : 7;
        const DPR_CAP = mobile ? 1.25 : 1.6;

        // ── Sternenfeld: ein einziger Points-Draw mit Twinkle-Shader ──
        const positions = new Float32Array(STAR_COUNT * 3);
        const sizes = new Float32Array(STAR_COUNT);
        const phases = new Float32Array(STAR_COUNT);
        const speeds = new Float32Array(STAR_COUNT);
        const colors = new Float32Array(STAR_COUNT * 3);
        const palette = [
          [1, 1, 1], // Weiß
          [0.68, 0.92, 1], // Eisblau
          [0.96, 0.84, 0.54], // Gold
          [0.79, 0.65, 1], // Violett
        ];
        for (let i = 0; i < STAR_COUNT; i += 1) {
          positions[i * 3] = (Math.random() - 0.5) * 34;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
          positions[i * 3 + 2] = 5 - Math.random() * 20; // Tiefe: nah bis fern
          const hero = Math.random() < 0.03;
          sizes[i] = hero ? 2.6 + Math.random() * 1.2 : 0.55 + Math.random() * 1.5;
          phases[i] = Math.random() * Math.PI * 2;
          speeds[i] = 0.35 + Math.random() * 1.3;
          const tint =
            palette[
              Math.random() < 0.6 ? 0 : 1 + Math.floor(Math.random() * (palette.length - 1))
            ];
          colors[i * 3] = tint[0];
          colors[i * 3 + 1] = tint[1];
          colors[i * 3 + 2] = tint[2];
        }
        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        starGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
        starGeometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
        starGeometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: 1 },
          },
          vertexShader: /* glsl */ `
            attribute float aSize;
            attribute float aPhase;
            attribute float aSpeed;
            attribute vec3 aColor;
            uniform float uTime;
            uniform float uPixelRatio;
            varying vec3 vColor;
            varying float vTwinkle;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              float twinkle = 0.62 + 0.38 * sin(uTime * aSpeed + aPhase);
              vTwinkle = twinkle;
              vColor = aColor;
              gl_PointSize = aSize * uPixelRatio * (30.0 / -mv.z) * (0.75 + 0.45 * twinkle);
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: /* glsl */ `
            varying vec3 vColor;
            varying float vTwinkle;
            void main() {
              float d = length(gl_PointCoord - vec2(0.5));
              float glow = smoothstep(0.5, 0.06, d);
              float core = smoothstep(0.16, 0.0, d);
              float alpha = (glow * 0.6 + core * 0.9) * vTwinkle;
              if (alpha < 0.01) discard;
              gl_FragColor = vec4(vColor, alpha);
            }
          `,
        });
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // ── Nebel: weiche additive Sprites in Markenfarben ──
        const nebulaCanvas = document.createElement("canvas");
        nebulaCanvas.width = 256;
        nebulaCanvas.height = 256;
        const nctx = nebulaCanvas.getContext("2d")!;
        const gradient = nctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.4, "rgba(255,255,255,0.35)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        nctx.fillStyle = gradient;
        nctx.fillRect(0, 0, 256, 256);
        const nebulaTexture = new THREE.CanvasTexture(nebulaCanvas);

        const NEBULA_COLORS = ["#9B5CFF", "#42D9FF", "#FF4FD8", "#1B4DFF", "#7CFF6B"];
        const nebulae: Array<{
          sprite: import("three").Sprite;
          material: import("three").SpriteMaterial;
          baseX: number;
          baseY: number;
          drift: number;
          spin: number;
        }> = [];
        for (let i = 0; i < NEBULA_COUNT; i += 1) {
          const material = new THREE.SpriteMaterial({
            map: nebulaTexture,
            color: new THREE.Color(NEBULA_COLORS[i % NEBULA_COLORS.length]),
            transparent: true,
            opacity: i % NEBULA_COLORS.length === 4 ? 0.045 : 0.075 + Math.random() * 0.06,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            rotation: Math.random() * Math.PI,
          });
          const sprite = new THREE.Sprite(material);
          const baseX = (Math.random() - 0.5) * 26;
          const baseY = (Math.random() - 0.5) * 16;
          sprite.position.set(baseX, baseY, -6 - Math.random() * 8);
          const size = 9 + Math.random() * 13;
          sprite.scale.set(size, size, 1);
          scene.add(sprite);
          nebulae.push({
            sprite,
            material,
            baseX,
            baseY,
            drift: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.0009,
          });
        }

        // ── Sternschnuppe: ein Streak-Sprite, taucht alle 6–15 s auf ──
        const streakCanvas = document.createElement("canvas");
        streakCanvas.width = 256;
        streakCanvas.height = 24;
        const sctx = streakCanvas.getContext("2d")!;
        const streakGradient = sctx.createLinearGradient(0, 0, 256, 0);
        streakGradient.addColorStop(0, "rgba(255,255,255,0)");
        streakGradient.addColorStop(0.75, "rgba(210,235,255,0.55)");
        streakGradient.addColorStop(0.97, "rgba(255,255,255,1)");
        streakGradient.addColorStop(1, "rgba(255,255,255,0)");
        sctx.fillStyle = streakGradient;
        sctx.fillRect(0, 0, 256, 24);
        const streakTexture = new THREE.CanvasTexture(streakCanvas);
        const streakMaterial = new THREE.SpriteMaterial({
          map: streakTexture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const streak = new THREE.Sprite(streakMaterial);
        streak.scale.set(4.2, 0.32, 1);
        scene.add(streak);
        const shootingStar = {
          active: false,
          nextAt: performance.now() + 4000 + Math.random() * 6000,
          startAt: 0,
          duration: 1200,
          fromX: 0,
          fromY: 0,
          dirX: -1,
          dirY: -0.45,
        };

        // ── Bewegungszustand: Scroll- und Pointer-Parallaxe, sanft gelerpt ──
        const state = {
          scroll: 0,
          scrollTarget: 0,
          pointerX: 0,
          pointerY: 0,
          pointerTargetX: 0,
          pointerTargetY: 0,
        };
        const finePointer = window.matchMedia("(pointer: fine)").matches;

        const onPointerMove = (event: PointerEvent) => {
          state.pointerTargetX = event.clientX / window.innerWidth - 0.5;
          state.pointerTargetY = event.clientY / window.innerHeight - 0.5;
        };
        if (finePointer) {
          window.addEventListener("pointermove", onPointerMove, { passive: true });
        }

        const resize = () => {
          const width = window.innerWidth;
          const height = window.innerHeight;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
          renderer.setPixelRatio(dpr);
          renderer.setSize(width, height, false);
          starMaterial.uniforms.uPixelRatio.value = dpr;
        };
        window.addEventListener("resize", resize);
        resize();

        const clock = new THREE.Clock();
        const render = () => {
          const elapsed = clock.getElapsedTime();
          const now = performance.now();
          starMaterial.uniforms.uTime.value = elapsed;

          // Scroll: Sterne ziehen langsam nach oben, Feld dreht minimal mit
          state.scrollTarget = window.scrollY;
          state.scroll += (state.scrollTarget - state.scroll) * 0.06;
          state.pointerX += (state.pointerTargetX - state.pointerX) * 0.04;
          state.pointerY += (state.pointerTargetY - state.pointerY) * 0.04;

          camera.position.x = state.pointerX * 0.55;
          camera.position.y = -state.scroll * 0.0011 - state.pointerY * 0.35;
          camera.lookAt(0, camera.position.y * 0.92, -6);
          stars.rotation.z = state.scroll * 0.000045 + elapsed * 0.004;

          for (const nebula of nebulae) {
            nebula.sprite.position.x = nebula.baseX + Math.sin(elapsed * 0.05 + nebula.drift) * 0.9;
            nebula.sprite.position.y = nebula.baseY + Math.cos(elapsed * 0.04 + nebula.drift) * 0.7;
            nebula.material.rotation += nebula.spin;
          }

          if (!shootingStar.active && now >= shootingStar.nextAt) {
            shootingStar.active = true;
            shootingStar.startAt = now;
            shootingStar.duration = 1000 + Math.random() * 500;
            shootingStar.fromX = 4 + Math.random() * 10;
            shootingStar.fromY = 3 + Math.random() * 5;
            shootingStar.dirX = -(8 + Math.random() * 5);
            shootingStar.dirY = -(2.5 + Math.random() * 2.5);
            streakMaterial.rotation = Math.atan2(shootingStar.dirY, shootingStar.dirX);
          }
          if (shootingStar.active) {
            const t = (now - shootingStar.startAt) / shootingStar.duration;
            if (t >= 1) {
              shootingStar.active = false;
              shootingStar.nextAt = now + 6000 + Math.random() * 9000;
              streakMaterial.opacity = 0;
            } else {
              streak.position.set(
                shootingStar.fromX + shootingStar.dirX * t,
                shootingStar.fromY + shootingStar.dirY * t + camera.position.y,
                -4,
              );
              streakMaterial.opacity = Math.sin(t * Math.PI) * 0.85;
            }
          }

          renderer.render(scene, camera);
        };

        let live = !document.hidden;
        const syncLoop = () => {
          renderer.setAnimationLoop(!disposed && live ? render : null);
        };
        const onVisibility = () => {
          live = !document.hidden;
          syncLoop();
        };
        document.addEventListener("visibilitychange", onVisibility);

        const onContextLost = (event: Event) => {
          event.preventDefault();
          mount.classList.remove("is-live");
          document.documentElement.classList.remove("galaxy-live");
          renderer.setAnimationLoop(null);
        };
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);

        render();
        mount.classList.add("is-live");
        document.documentElement.classList.add("galaxy-live");
        syncLoop();

        cleanup = () => {
          renderer.setAnimationLoop(null);
          window.removeEventListener("resize", resize);
          if (finePointer) window.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("visibilitychange", onVisibility);
          renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
          document.documentElement.classList.remove("galaxy-live");
          starGeometry.dispose();
          starMaterial.dispose();
          nebulaTexture.dispose();
          streakTexture.dispose();
          streakMaterial.dispose();
          for (const nebula of nebulae) nebula.material.dispose();
          scene.clear();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
        };
      } catch (error) {
        // WebGL nicht verfügbar → CSS-Fallback bleibt einfach stehen
        console.warn("[galaxy-bg] deaktiviert:", error);
      }
    };

    void init();

    // Wechselt der User mitten in der Session auf Reduced Motion → Szene abbauen
    const onReducedChange = () => {
      if (!reduced.matches) return;
      cleanup?.();
      cleanup = undefined;
      mount.classList.remove("is-live");
    };
    reduced.addEventListener("change", onReducedChange);

    return () => {
      disposed = true;
      reduced.removeEventListener("change", onReducedChange);
      cleanup?.();
    };
  }, [isAdmin]);

  if (isAdmin) return null;
  return <div className="galaxy-bg" ref={mountRef} aria-hidden="true" />;
}
