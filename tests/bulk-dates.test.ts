import { test } from "node:test";
import assert from "node:assert/strict";
import { isIsoDate, normalizeDates, parseDateList, seriesDates } from "../lib/bulk-dates.ts";

test("isIsoDate erkennt echte Kalendertage", () => {
  assert.equal(isIsoDate("2026-09-03"), true);
  assert.equal(isIsoDate("2026-02-31"), false); // sieht nur wie ein Datum aus
  assert.equal(isIsoDate("2026-9-3"), false);
  assert.equal(isIsoDate(""), false);
});

test("seriesDates: wöchentlich und 14-tägig inkl. Startdatum", () => {
  assert.deepEqual(seriesDates("2026-09-03", "weekly", 3), ["2026-09-03", "2026-09-10", "2026-09-17"]);
  assert.deepEqual(seriesDates("2026-09-03", "biweekly", 3), ["2026-09-03", "2026-09-17", "2026-10-01"]);
});

test("seriesDates: monatlich springt über den Monatswechsel", () => {
  assert.deepEqual(seriesDates("2026-11-15", "monthly", 3), ["2026-11-15", "2026-12-15", "2027-01-15"]);
});

test("seriesDates: der 31. fällt auf den letzten Tag des kürzeren Monats", () => {
  assert.deepEqual(seriesDates("2027-01-31", "monthly", 3), ["2027-01-31", "2027-02-28", "2027-03-31"]);
});

test("seriesDates: ungültige Eingaben liefern nichts, Länge ist gedeckelt", () => {
  assert.deepEqual(seriesDates("morgen", "weekly", 3), []);
  assert.deepEqual(seriesDates("2026-09-03", "weekly", 0), []);
  assert.equal(seriesDates("2026-09-03", "weekly", 99).length, 52);
});

test("normalizeDates entfernt Dubletten und Müll und sortiert", () => {
  assert.deepEqual(
    normalizeDates(["2026-10-01", "2026-09-01", "2026-10-01", "quatsch", " 2026-08-01 "]),
    ["2026-08-01", "2026-09-01", "2026-10-01"],
  );
});

test("parseDateList liest die kommaseparierte Liste aus dem Formular", () => {
  assert.deepEqual(parseDateList("2026-09-10,2026-09-03,2026-09-03"), ["2026-09-03", "2026-09-10"]);
  assert.deepEqual(parseDateList(""), []);
});
