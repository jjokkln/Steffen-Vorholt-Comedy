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

/**
 * Regel seit 30.07.2026: JEDES Video hat ein Vorschaubild.
 *
 * Grund: Die Videos laden mit `preload="none"` (Egress — siehe context/troubleshooting.md),
 * es gibt also kein „erstes Videobild" mehr, das der Browser von allein zeigen könnte. Ohne
 * Poster bleibt die Fläche schwarz. Das Admin baut aus jedem Video-Platz plus seinem
 * `posterKey` genau eine Karte; ein Video ohne `posterKey` ergäbe eine halbe Karte.
 */
test("jeder Video-Platz verweist auf einen vorhandenen Vorschaubild-Platz", () => {
  const videos = SITE_MEDIA_SLOTS.filter((slot) => slot.kind === "video");
  assert.ok(videos.length > 0, "Es gibt keine Video-Plätze — Test ist wertlos geworden.");

  for (const video of videos) {
    assert.ok(video.posterKey, `Video-Platz "${video.key}" hat kein posterKey.`);
    const poster = siteMediaSlot(video.posterKey!);
    assert.ok(poster, `posterKey "${video.posterKey}" von "${video.key}" zeigt auf keinen Platz.`);
    assert.equal(
      poster!.kind,
      "image",
      `posterKey "${video.posterKey}" von "${video.key}" zeigt auf ein Video, nicht auf ein Bild.`,
    );
    assert.equal(
      poster!.aspect,
      video.aspect,
      `Seitenverhältnis von "${poster!.key}" passt nicht zu "${video.key}" — der Zuschnitt im Admin würde ein Standbild erzeugen, das nicht zum Video passt.`,
    );
  }
});

test("kein Vorschaubild-Platz ist mehreren Videos zugeordnet", () => {
  // Zwei Videos auf denselben Poster zeigen zu lassen hieße: ein Upload im Admin ändert
  // still auch das andere Video. Die Fallback-Kette (steffen_portrait_poster ->
  // home_portrait_poster) ist der richtige Weg dafür, eine Doppel-Zuordnung nicht.
  const posterKeys = SITE_MEDIA_SLOTS.flatMap((slot) => (slot.posterKey ? [slot.posterKey] : []));
  assert.equal(new Set(posterKeys).size, posterKeys.length, `Doppelt vergeben: ${posterKeys}`);
});
