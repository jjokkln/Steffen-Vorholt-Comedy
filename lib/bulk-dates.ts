/**
 * Datums-Helfer für das Anlegen mehrerer Termine an einem Spielort
 * (components/admin/VenueEventsForm.tsx + lib/actions/events.ts).
 *
 * Bewusst reine Funktionen ohne Date-Locale-Kram: gerechnet wird in UTC, damit
 * ein Termin am 1. eines Monats nicht in der Sommerzeit auf den 31. zurückfällt.
 */

export type SeriesInterval = "weekly" | "biweekly" | "monthly";

export const SERIES_INTERVALS: { key: SeriesInterval; label: string }[] = [
  { key: "weekly", label: "wöchentlich" },
  { key: "biweekly", label: "alle 2 Wochen" },
  { key: "monthly", label: "monatlich" },
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Echtes Kalenderdatum? `2026-02-31` sieht nur wie eins aus. */
export function isIsoDate(value: string): boolean {
  if (!ISO.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Monatssprung mit Tages-Deckelung: 31.01. + 1 Monat = 28./29.02., nicht der
 * 03.03. (was das naive setUTCMonth liefern würde).
 */
function addMonths(iso: string, months: number): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7)) - 1;
  const day = Number(iso.slice(8, 10));
  const lastDay = new Date(Date.UTC(year, month + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month + months, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

/**
 * Serie ab `start`, inklusive Startdatum. `count` = Anzahl Termine insgesamt.
 * Ungültiges Startdatum oder count < 1 → leere Liste (das Formular blockt das
 * ohnehin, die Action verlässt sich nicht darauf).
 */
export function seriesDates(start: string, interval: SeriesInterval, count: number): string[] {
  if (!isIsoDate(start) || !Number.isInteger(count) || count < 1) return [];
  const capped = Math.min(count, 52);
  const out: string[] = [];
  for (let i = 0; i < capped; i++) {
    if (interval === "monthly") out.push(addMonths(start, i));
    else out.push(addDays(start, i * (interval === "biweekly" ? 14 : 7)));
  }
  return out;
}

/** Wirft Müll und Dubletten raus und sortiert aufsteigend. */
export function normalizeDates(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(isIsoDate))].sort();
}

/**
 * Liest die Datumsliste aus dem Formular. Das Client-Formular schickt sie als
 * ein kommasepariertes hidden field, damit die Anzahl der Felder nicht am DOM
 * hängt.
 */
export function parseDateList(raw: string): string[] {
  return normalizeDates(raw.split(","));
}
