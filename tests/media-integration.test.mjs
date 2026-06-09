import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mediaRoot = join(projectRoot, "public", "assets", "media");

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function assertValidWebP(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${path} is not RIFF`);
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${path} is not WebP`);
}

// 1. The currently uploaded WebP assets exist and are valid.
const webpFiles = walk(mediaRoot).filter((p) => extname(p).toLowerCase() === ".webp");
assert.equal(webpFiles.length, 5, "Expected the five currently uploaded WebP assets");
webpFiles.forEach(assertValidWebP);

// 2. Required media files live under public/assets/media so Next.js serves them at /assets/media/...
const requiredMedia = [
  "public/assets/media/steffen/steffen-stage-loop-hero.mp4",
  "public/assets/media/brand/steffen-vorholt-logo-primary.svg",
  "public/assets/media/shows/brain-loading/brain-loading-hero.webp",
  "public/assets/media/shows/brain-loading/brain-loading-planet.webp",
  "public/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp",
  "public/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp",
];
for (const rel of requiredMedia) {
  assert.ok(existsSync(join(projectRoot, rel)), `Missing required media: ${rel}`);
}

// 3. The home hero component keeps the autoplaying stage video and the layout toggle.
const heroSource = readFileSync(join(projectRoot, "components/HomeHero.tsx"), "utf8");
assert.match(heroSource, /\/assets\/media\/steffen\/steffen-stage-loop-hero\.mp4/);
for (const attr of ["autoPlay", "muted", "loop", "playsInline"]) {
  assert.match(heroSource, new RegExp(attr), `HomeHero must keep the ${attr} video attribute`);
}
assert.match(heroSource, /data-home-hero/);
assert.match(heroSource, /data-hero-mode="card"/);
assert.match(heroSource, /data-hero-mode="full"/);

// 4. Components/pages reference every show image and the brand logo.
const sourceFiles = walk(join(projectRoot, "app"))
  .concat(walk(join(projectRoot, "components")))
  .filter((p) => p.endsWith(".tsx"));
const allSource = sourceFiles.map((p) => readFileSync(p, "utf8")).join("\n");
const referencedImages = [
  "/assets/media/brand/steffen-vorholt-logo-primary.svg",
  "/assets/media/shows/brain-loading/brain-loading-planet.webp",
  "/assets/media/shows/brain-loading/brain-loading-hero.webp",
  "/assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp",
  "/assets/media/shows/comedy-check-in/comedy-check-in-planet.webp",
];
for (const ref of referencedImages) {
  assert.ok(allSource.includes(ref), `No component references ${ref}`);
}

// 5. The static event data still carries all three shows.
const eventsSource = readFileSync(join(projectRoot, "lib/events.ts"), "utf8");
for (const show of ["Brain Loading", "Comedy Eiskalt", "Comedy Check-In"]) {
  assert.ok(eventsSource.includes(show), `events.ts must contain ${show}`);
}

console.log(
  `Media integration checks passed: ${webpFiles.length} WebP assets, hero video, ${sourceFiles.length} source files scanned.`,
);
