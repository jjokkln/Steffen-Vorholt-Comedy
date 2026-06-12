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
