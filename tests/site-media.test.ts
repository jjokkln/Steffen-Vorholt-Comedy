import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSiteMedia, siteMediaSlot, SITE_MEDIA_SLOTS } from "../lib/site-media.ts";

test("resolveSiteMedia: gepflegter Wert gewinnt", () => {
  assert.equal(
    resolveSiteMedia({ home_trailer_video: "media/trailer-1.mp4" }, "home_trailer_video"),
    "media/trailer-1.mp4",
  );
});

test("resolveSiteMedia: leerer Platz fällt auf die mitgelieferte Datei zurück", () => {
  assert.equal(
    resolveSiteMedia({ home_trailer_video: "   " }, "home_trailer_video"),
    "/assets/media/steffen/steffen-trailer.mp4",
  );
});

test("resolveSiteMedia: /steffen erbt das Video der Startseite", () => {
  assert.equal(
    resolveSiteMedia({ home_portrait_video: "media/portrait.mp4" }, "steffen_portrait_video"),
    "media/portrait.mp4",
  );
});

test("resolveSiteMedia: der alte Schlüssel hero_video greift vor der lokalen Reserve", () => {
  assert.equal(
    resolveSiteMedia({ hero_video: "media/alt.mp4" }, "home_portrait_video"),
    "media/alt.mp4",
  );
  // …und auch über zwei Kettenglieder hinweg (/steffen -> Startseite -> hero_video).
  assert.equal(
    resolveSiteMedia({ hero_video: "media/alt.mp4" }, "steffen_portrait_video"),
    "media/alt.mp4",
  );
});

test("resolveSiteMedia: unbekannter Schlüssel liefert leer", () => {
  assert.equal(resolveSiteMedia({}, "gibt_es_nicht"), "");
});

test("Registry: Schlüssel sind eindeutig und Fallbacks zeigen auf Bekanntes", () => {
  const keys = SITE_MEDIA_SLOTS.map((s) => s.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const slot of SITE_MEDIA_SLOTS) {
    // `hero_video` ist der historische Schlüssel und absichtlich nicht als Platz gelistet.
    if (!slot.fallbackKey || slot.fallbackKey === "hero_video") continue;
    assert.ok(siteMediaSlot(slot.fallbackKey), `Fallback unbekannt: ${slot.fallbackKey}`);
  }
});
