import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { MEDIA_REFERENCES, splitStoragePath } from "../lib/media-refs.ts";

/**
 * Warum es diesen Test gibt: `MEDIA_REFERENCES` ist eine Liste, die man beim Anlegen
 * einer neuen Medien-Spalte vergisst — und dann **schlägt nichts fehl**. Die Anwendung
 * läuft weiter, der Build ist grün, nur zwei Dinge gehen still schief: Der Medien-Check
 * meldet die Datei als verwaist, obwohl sie benutzt wird, und `deleteFileIfUnused()`
 * hält sie beim nächsten Aufräumen für Müll und **löscht sie**.
 *
 * Dieselbe Klasse wie die Rechtstexte im Pflichtkern (Punkt 4): eine Liste, die neben
 * dem Code hergeht und von keinem Compiler gehalten wird. Hier ist der Test das
 * Gegenmittel.
 */

const LIB = new URL("../lib/", import.meta.url).pathname;

/** Alle Spaltennamen, die im Code wie ein Storage-Pfad aussehen. */
function pathColumnsInCode(): Set<string> {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
      const source = readFileSync(full, "utf8");
      for (const match of source.matchAll(/\b([a-z][a-z0-9]*(?:_[a-z0-9]+)*_path)\b/g)) {
        found.add(match[1]);
      }
    }
  };
  walk(LIB);
  return found;
}

test("jede *_path-Spalte im Code steht in MEDIA_REFERENCES", () => {
  const registered = new Set(MEDIA_REFERENCES.map((ref) => ref.column));
  // `file_path` endet nicht auf `_path` im Sinne des Musters oben — es steckt drin,
  // aber als Sonderfall der Tabelle `site_media`. Separat geprüft.
  assert.ok(registered.has("file_path"), "site_media.file_path fehlt in der Registry");

  const missing = [...pathColumnsInCode()].filter((column) => !registered.has(column));
  assert.deepEqual(
    missing,
    [],
    `Diese Spalten tauchen im Code auf, stehen aber nicht in lib/media-refs.ts: ${missing.join(", ")}. ` +
      "Ohne Eintrag hält der Medien-Check die Dateien für verwaist und das Aufräumen löscht sie.",
  );
});

test("MEDIA_REFERENCES hat keine doppelten Tabelle/Spalte-Paare", () => {
  const keys = MEDIA_REFERENCES.map((ref) => `${ref.table}.${ref.column}`);
  assert.equal(new Set(keys).size, keys.length, `Doppelte Einträge: ${keys.join(", ")}`);
});

test("splitStoragePath trennt Bucket und Datei", () => {
  assert.deepEqual(splitStoragePath("gallery/foto.png"), { bucket: "gallery", file: "foto.png" });
  assert.deepEqual(splitStoragePath("media/unter/ordner.mp4"), { bucket: "media", file: "unter/ordner.mp4" });
});

test("splitStoragePath lehnt ab, was kein Storage-Pfad ist", () => {
  // Lokale Datei aus public/ — die gehört dem Repo, nicht dem Storage.
  assert.equal(splitStoragePath("/assets/media/steffen/trailer.mp4"), null);
  assert.equal(splitStoragePath(""), null);
  // Ohne Schrägstrich fehlt der Bucket, mit abschließendem fehlt die Datei. Beides
  // würde sonst zu `remove([""])` führen — ein Löschaufruf ohne Ziel.
  assert.equal(splitStoragePath("nurbucket"), null);
  assert.equal(splitStoragePath("gallery/"), null);
});
