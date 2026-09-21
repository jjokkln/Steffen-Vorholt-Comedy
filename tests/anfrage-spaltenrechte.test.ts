import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Warum es diese Tests gibt: Migration 0024 gibt `anon` nur noch INSERT auf genau die
 * Spalten, die das Anfrageformular sendet. Diese Liste steht damit an zwei Orten — im SQL
 * und in der Server Action. Laufen sie auseinander, wird nichts rot: Der Build kennt das
 * SQL nicht, und das SQL kennt die Action nicht. Auffallen würde es erst, wenn jemand das
 * Formular abschickt und ein „permission denied for column" im Server-Log landet.
 *
 * Genau dafür verlangt Regel supabase-sicherheit Punkt 16 einen Test zwischen den beiden
 * Orten. Er prüft keine Datenbank — er hält zwei Dateien gegeneinander.
 */

const MIGRATION = readFileSync(
  new URL("../supabase/migrations/0024_anfragen_nur_formularspalten.sql", import.meta.url),
  "utf8",
);
const ACTION = readFileSync(
  new URL("../lib/actions/submit-inquiry.ts", import.meta.url),
  "utf8",
);

/** Die Spalten aus `grant insert (…) on public.inquiries to anon;` */
function spaltenAusMigration(): string[] {
  const treffer = MIGRATION.match(
    /grant\s+insert\s*\(([^)]*)\)\s*on\s+public\.inquiries\s+to\s+anon/i,
  );
  assert.ok(treffer, "Kein `grant insert (…) on public.inquiries to anon` in Migration 0024 gefunden");
  return treffer[1].split(",").map((s) => s.trim()).filter(Boolean).sort();
}

/** Die Felder aus `const inquiry = { … };` in der Server Action */
function felderAusAction(): string[] {
  const treffer = ACTION.match(/const\s+inquiry\s*=\s*\{([^}]*)\}/);
  assert.ok(treffer, "Kein `const inquiry = { … }` in submit-inquiry.ts gefunden");
  return treffer[1]
    .split(",")
    .map((s) => s.split(":")[0].trim())
    .filter(Boolean)
    .sort();
}

test("die Server Action sendet genau die Spalten, die anon einfügen darf", () => {
  assert.deepEqual(
    felderAusAction(),
    spaltenAusMigration(),
    "Formularfelder und GRANT laufen auseinander — ein Feld mehr in der Action bricht das " +
      "Absenden mit „permission denied for column“, ein Feld mehr im GRANT öffnet eine Spalte, " +
      "die niemand von außen setzen können soll.",
  );
});

test("status und created_at sind NICHT freigegeben", () => {
  // Der eigentliche Zweck der Migration: `status` steuert beide „neu“-Zähler im Admin,
  // `created_at` die Sortierung der Anfragenliste. Wer beide setzen darf, kann eine
  // Buchungsanfrage unsichtbar machen — gemessen am 21.09.2026, damals Fehlercode 23514
  // (CHECK) statt 42501 (fehlendes Spaltenrecht).
  const erlaubt = spaltenAusMigration();
  for (const gesperrt of ["status", "created_at", "id"]) {
    assert.ok(
      !erlaubt.includes(gesperrt),
      `"${gesperrt}" darf nicht im GRANT für anon stehen (steht drin: ${erlaubt.join(", ")})`,
    );
  }
});

test("der Policy bleibt die Wertprüfung als zweite Schicht erhalten", () => {
  // Spaltenrechte allein wären weg, sobald jemand ein `grant all on all tables … to anon`
  // ausführt — das steht in vielen Supabase-Anleitungen. Die Policy fängt den Fall ab.
  assert.match(MIGRATION, /create\s+policy\s+"public insert inquiries"/i);
  assert.match(MIGRATION, /with\s+check\s*\(\s*status\s*=\s*'new'\s*\)/i);
});
