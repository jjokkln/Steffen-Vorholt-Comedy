import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const publicPages = [
  "index.html",
  "termine.html",
  "kalender.html",
  "archiv.html",
  "comedians-bewerben.html",
  "steffen-buchen.html",
  "shows/index.html",
  "shows/brain-loading.html",
  "shows/comedy-eiskalt.html",
  "shows/comedy-check-in.html",
  "shows/brain-loading-termine.html",
  "shows/comedy-eiskalt-termine.html",
  "shows/comedy-check-in-termine.html",
];

const expectedPageMedia = {
  "index.html": [
    "assets/media/shows/brain-loading/brain-loading-planet.webp",
    "assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp",
    "assets/media/shows/comedy-check-in/comedy-check-in-planet.webp",
  ],
  "shows/index.html": [
    "../assets/media/shows/brain-loading/brain-loading-planet.webp",
    "../assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp",
    "../assets/media/shows/comedy-check-in/comedy-check-in-planet.webp",
  ],
  "shows/brain-loading.html": [
    "../assets/media/shows/brain-loading/brain-loading-hero.webp",
  ],
  "shows/comedy-eiskalt.html": [
    "../assets/media/shows/comedy-eiskalt/comedy-eiskalt-planet.webp",
  ],
  "shows/comedy-check-in.html": [
    "../assets/media/shows/comedy-check-in/comedy-check-in-planet.webp",
  ],
};

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function imageSources(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
}

function assertValidWebP(path) {
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${path} is not RIFF`);
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${path} is not WebP`);
}

for (const relativePage of publicPages) {
  const absolutePage = join(projectRoot, relativePage);
  const html = readFileSync(absolutePage, "utf8");
  const sources = imageSources(html);
  const expectedLogo = relativePage.startsWith("shows/")
    ? "../assets/media/brand/steffen-vorholt-logo-primary.svg"
    : "assets/media/brand/steffen-vorholt-logo-primary.svg";

  assert.ok(
    sources.filter((source) => source === expectedLogo).length >= 2,
    `${relativePage} must use the primary logo in navigation and footer`,
  );

  for (const source of sources) {
    if (/^(?:https?:|data:)/.test(source)) continue;
    const target = normalize(resolve(dirname(absolutePage), source));
    assert.ok(existsSync(target), `${relativePage} references missing image ${source}`);
  }

  for (const expectedSource of expectedPageMedia[relativePage] ?? []) {
    assert.ok(
      sources.includes(expectedSource),
      `${relativePage} must include ${expectedSource}`,
    );
  }
}

const homeHtml = readFileSync(join(projectRoot, "index.html"), "utf8");
assert.match(homeHtml, /<video\b[^>]*\bautoplay\b[^>]*\bmuted\b[^>]*\bloop\b[^>]*\bplaysinline\b/);
assert.match(homeHtml, /<source src="assets\/media\/steffen\/steffen-stage-loop-hero\.mp4" type="video\/mp4"/);
assert.match(homeHtml, /data-home-hero/);
assert.match(homeHtml, /data-hero-layout-toggle/);
assert.match(homeHtml, /data-hero-mode="card"/);
assert.match(homeHtml, /data-hero-mode="full"/);
assert.ok(
  existsSync(join(projectRoot, "assets/media/steffen/steffen-stage-loop-hero.mp4")),
  "The Steffen hero video must exist",
);

const mainJs = readFileSync(join(projectRoot, "assets/js/main.js"), "utf8");
assert.match(mainJs, /function setupHeroLayoutToggle\(/);
assert.match(mainJs, /homeHeroMode/);
assert.match(mainJs, /setupHeroLayoutToggle\(\)/);

const webpFiles = walk(join(projectRoot, "assets", "media"))
  .filter((path) => extname(path).toLowerCase() === ".webp");

assert.equal(webpFiles.length, 5, "Expected the five currently uploaded WebP assets");
webpFiles.forEach(assertValidWebP);

console.log(`Media integration checks passed for ${publicPages.length} public pages.`);
