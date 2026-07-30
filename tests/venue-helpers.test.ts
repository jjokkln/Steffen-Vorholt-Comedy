import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VENUE_FALLBACK_COLOR,
  buildVenueMarkers,
  constellationLinks,
  isInNrw,
  roundCoord,
} from "../lib/venue-helpers.ts";

const shows = [
  { id: "show-brain", color: "#7CFF6B" },
  { id: "show-ice", color: "#AEEBFF" },
];

const venues = [
  { id: "v-dortmund", city: "Dortmund", venue: "Subrosa", lat: 51.51, lng: 7.47, show_id: null },
  { id: "v-bochum", city: "Bochum", venue: "Bahnhof Langendreer", lat: 51.48, lng: 7.29, show_id: "show-ice" },
  { id: "v-koeln", city: "Köln", venue: "Wechselnde Bühne", lat: 50.94, lng: 6.96, show_id: null },
];

const events = [
  { id: "e2", venue_id: "v-dortmund", date: "2026-09-01", shows: { color: "#FF9F43" } },
  { id: "e1", venue_id: "v-dortmund", date: "2026-08-01", shows: { color: "#7CFF6B" } },
  { id: "e3", venue_id: null, date: "2026-08-15", shows: { color: "#7CFF6B" } }, // ohne Ort → nicht auf der Karte
];

test("buildVenueMarkers bündelt Termine pro Ort und sortiert nach Datum", () => {
  // @ts-expect-error – Testdaten enthalten nur die genutzten Felder
  const markers = buildVenueMarkers(venues, events, shows);
  const dortmund = markers.find((m) => m.venue.id === "v-dortmund");
  assert.deepEqual(dortmund?.events.map((e) => e.id), ["e1", "e2"]);
});

test("buildVenueMarkers ignoriert Termine ohne venue_id", () => {
  // @ts-expect-error – Testdaten enthalten nur die genutzten Felder
  const markers = buildVenueMarkers(venues, events, shows);
  const total = markers.reduce((n, m) => n + m.events.length, 0);
  assert.equal(total, 2); // e3 hängt an keinem Ort
});

test("Markerfarbe: Show-Zuordnung schlägt Termin-Farbe schlägt Fallback", () => {
  // @ts-expect-error – Testdaten enthalten nur die genutzten Felder
  const markers = buildVenueMarkers(venues, events, shows);
  const byId = new Map(markers.map((m) => [m.venue.id, m.color]));
  assert.equal(byId.get("v-bochum"), "#AEEBFF"); // aus venue.show_id
  assert.equal(byId.get("v-dortmund"), "#7CFF6B"); // aus dem nächsten Termin
  assert.equal(byId.get("v-koeln"), VENUE_FALLBACK_COLOR); // weder noch
});

test("buildVenueMarkers sortiert Orte alphabetisch", () => {
  // @ts-expect-error – Testdaten enthalten nur die genutzten Felder
  const markers = buildVenueMarkers(venues, events, shows);
  assert.deepEqual(markers.map((m) => m.venue.city), ["Bochum", "Dortmund", "Köln"]);
});

test("constellationLinks verbindet jeden Ort mit dem nächsten Nachbarn, ohne Doppelkanten", () => {
  // Kein @ts-expect-error nötig: `constellationLinks` braucht nur id/lat/lon, und genau die
  // haben die Testdaten. Bei `buildVenueMarkers` ist das anders — dort bleibt die Direktive.
  const links = constellationLinks(venues);
  const keys = links.map(([a, b]) => [a.id, b.id].sort().join("~")).sort();
  // Bochum↔Dortmund liegen sich gegenseitig am nächsten → nur EINE Kante.
  // Köln ist am weitesten weg und hängt sich an Bochum.
  assert.deepEqual(keys, ["v-bochum~v-dortmund", "v-bochum~v-koeln"]);
});

test("constellationLinks bleibt bei weniger als zwei Orten leer", () => {
  assert.deepEqual(constellationLinks(venues.slice(0, 1)), []);
  assert.deepEqual(constellationLinks([]), []);
});

test("roundCoord kürzt auf 4 Dezimalen", () => {
  assert.equal(roundCoord(51.5123456), 51.5123);
  assert.equal(roundCoord(7.4699999), 7.47);
});

test("isInNrw prüft gegen die NRW-Box", () => {
  assert.equal(isInNrw(51.51, 7.47), true); // Dortmund
  assert.equal(isInNrw(52.52, 13.4), false); // Berlin
  assert.equal(isInNrw(48.14, 11.58), false); // München
});
