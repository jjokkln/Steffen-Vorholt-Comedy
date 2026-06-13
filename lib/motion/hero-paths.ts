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

// Ruhe-Dreieck: die drei Planeten bilden eine versetzte Triangle-Formation
// (Apex oben/mittig = größter Planet, zwei Basis-Planeten unten links/rechts)
// statt einer flachen Reihe. Leicht asymmetrisch, damit es natürlich „versetzt"
// wirkt. Die WebGL-Szene liest nur progress=0; das Idle-Float in
// HeroGalaxyScene lässt sie sanft innerhalb des Dreiecks herumschweben.
const DESKTOP_PATHS: PlanetPose[][] = [
  // primary (Brain Loading) – APEX oben, leicht links der Mitte, größter Planet
  [
    { at: 0, x: -0.20, y:  1.08, z: 0, scale: 1.06, rotation: -0.03, opacity: 1 },
    { at: 1, x: -0.20, y:  1.08, z: 0, scale: 1.06, rotation: -0.03, opacity: 1 },
  ],
  // secondary (Comedy Eiskalt) – Basis unten links
  [
    { at: 0, x: -2.65, y: -0.92, z: 0, scale: 1.00, rotation:  0.04, opacity: 1 },
    { at: 1, x: -2.65, y: -0.92, z: 0, scale: 1.00, rotation:  0.04, opacity: 1 },
  ],
  // tertiary (Comedy Check-In) – Basis unten rechts
  [
    { at: 0, x:  2.70, y: -0.72, z: 0, scale: 0.94, rotation:  0.03, opacity: 1 },
    { at: 1, x:  2.70, y: -0.72, z: 0, scale: 0.94, rotation:  0.03, opacity: 1 },
  ],
];

// Mobil: gestaffelte Reihe (untereinander leicht versetzt), damit sich die
// Planeten auf schmalen Screens nicht überlappen.
const MOBILE_PATHS: PlanetPose[][] = [
  [
    { at: 0, x: -1.25, y:  0.62, z: 0, scale: 0.64, rotation: -0.05, opacity: 1 },
    { at: 1, x: -1.25, y:  0.62, z: 0, scale: 0.64, rotation: -0.05, opacity: 1 },
  ],
  [
    { at: 0, x:  1.18, y:  0.12, z: 0, scale: 0.58, rotation:  0.04, opacity: 1 },
    { at: 1, x:  1.18, y:  0.12, z: 0, scale: 0.58, rotation:  0.04, opacity: 1 },
  ],
  [
    { at: 0, x: -0.18, y: -0.92, z: 0, scale: 0.52, rotation: -0.03, opacity: 1 },
    { at: 1, x: -0.18, y: -0.92, z: 0, scale: 0.52, rotation: -0.03, opacity: 1 },
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
    // Niedrigere Render-Auflösung = weniger Canvas-Pixel, die das blur-Nav pro
    // Frame neu rastern muss. Für die dekorativen Planeten-Sprites unkritisch.
    dprCap: desktop ? 1.5 : 1.25,
    starCount: desktop ? 120 : 48,
    trailCount: desktop ? 24 : 0,
    paths: (desktop ? DESKTOP_PATHS : MOBILE_PATHS)
      .slice(0, count)
      .map((path) => path.map((frame) => ({ ...frame }))),
  };
}
