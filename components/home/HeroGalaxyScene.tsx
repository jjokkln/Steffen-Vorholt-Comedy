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
