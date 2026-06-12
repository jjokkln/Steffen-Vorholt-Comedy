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
