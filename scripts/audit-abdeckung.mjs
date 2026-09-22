#!/usr/bin/env node
/**
 * Prüft, dass jede schreibende Server-Funktion entweder ins Audit-Log schreibt
 * oder mit Begründung in der Ausnahmeliste unten steht.
 *
 * ── Warum es diesen Test gibt ────────────────────────────────────────────────
 *
 * Eine neue **Aktion** ohne Beschriftung ist bereits ein Typfehler
 * (`AKTION_BESCHRIFTUNG` ist als `Record<AuditAktion, string>` typisiert). Eine
 * neue **Server Action ohne jedes Protokoll** ist dagegen nichts: kein
 * Typfehler, kein roter Test, keine Warnung. Ein fehlender Protokolleintrag
 * macht nichts kaputt — das ist dieselbe Fehlerklasse wie die Rechtstexte in
 * Pflichtkern Punkt 4, und genau deshalb verlangt Punkt 12 diesen Test.
 *
 * Der Beleg, dass das nicht theoretisch ist: Bei boltwork wurde am 16.09.2026
 * gezählt statt gelesen — 133 schreibende Server-Funktionen, 90 mit Protokoll.
 * Unter den Lücken war die Wochenfreigabe, also der Schritt, nach dem Geld
 * fließt; protokolliert wurde sechs Monate lang nur ihre *Rücknahme*.
 *
 * ── Was als „schreibend" gilt ────────────────────────────────────────────────
 *
 * Absichtlich grob: `.insert/.update/.delete/.upsert` und `.rpc(`. Das erzeugt
 * Falschmeldungen — etwa bei einer Funktion, die nur liest — und das ist
 * beabsichtigt. Eine Falschmeldung kostet einen Eintrag in der Liste, eine
 * übersehene Schreibfunktion kostet den Nachweis.
 *
 * Aufruf: `npm run test:audit-abdeckung`
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const WURZEL = new URL("..", import.meta.url).pathname;
const VERZEICHNISSE = ["lib", "app"];

/**
 * Schreibende Funktionen, die bewusst NICHT protokollieren.
 *
 * Schlüssel ist `<pfad ab Repo-Wurzel>::<funktion>`, Wert die Begründung.
 * Eine Begründung ist Pflicht und wird gelesen — „später" ist keine.
 */
const AUSNAHMEN = {
  // ── Anfrageformular (Besucher ohne Konto) ──
  // Die abgeschickte Anfrage IST der Datensatz — sie steht in `inquiries` mit
  // Zeitpunkt und Inhalt. Sie zusätzlich ins Audit-Log zu schreiben hieße, die
  // Daten eines Besuchers ein zweites Mal zu speichern (Pflichtkern Punkt 12,
  // Warnkasten). Was die Verwaltung damit tut — Status setzen, löschen —
  // protokolliert `lib/actions/inquiries.ts`.
  "lib/actions/submit-inquiry.ts::submitInquiry":
    "die Anfrage ist die Zeile in `inquiries`; protokolliert wird, was die Verwaltung damit tut",

  // ── Bremse ──
  // Ein Zähler, kein Vorgang an Inhalten. Jeden Tippfehler zu protokollieren
  // wäre Rauschen, in dem die Ereignisse untergehen, auf die es ankommt. Der
  // Fall, der zählt — „die Bremse greift gerade nicht" — steht im Server-Log.
  "lib/bremse.ts::fehlversuchZaehlen": "zählt Fehlversuche; ein Zähler ist kein Vorgang an Inhalten",
  "lib/bremse.ts::bremseGreift": "liest den Stand, ohne ihn zu erhöhen (Vorabprüfung)",
  "lib/bremse.ts::zuruecksetzen": "leert den eigenen Eimer nach erfolgreicher Anmeldung",

  // ── Einwilligung (Besucher ohne Konto) ──
  // Der Nachweis IST die Zeile in `einwilligungen`. Ein zweiter Eintrag im
  // Audit-Log wäre dieselbe Tatsache an zwei Orten — und das Audit-Log ist für
  // Handlungen an der Verwaltungsfläche da, nicht für Besucher.
  "lib/einwilligung-nachweis.ts::einwilligungNachweisen":
    "läuft im Browser; der Nachweis IST die Zeile in `einwilligungen` (Pflichtkern 12, Fall 3)",

  // ── Aufräumen ──
  "lib/actions/protokoll.ts::protokollAufraeumen":
    "löscht abgelaufene Protokollzeilen nach Frist; ein Protokoll über das Verfallen des Protokolls hat kein Ende",

  // ── Storage-Aufräumen ──
  // `deleteFileIfUnused` löscht eine Datei, auf die kein Datensatz mehr zeigt.
  // Sie läuft IMMER als Folge einer Handlung, die der Aufrufer bereits
  // protokolliert hat (Bild ersetzt, Show gelöscht, Medien-Platz geleert) —
  // hier zu protokollieren hieße, denselben Vorgang zweimal zu schreiben.
  "lib/media-refs.ts::deleteFileIfUnused":
    "Folge einer Handlung, die der Aufrufer protokolliert; ein zweiter Eintrag wäre derselbe Vorgang",

  // ── Die Schreibstelle selbst ──
  "lib/audit.ts::protokolliere": "ist die Protokollfunktion",
};

// `.remove(` ist dabei, weil Storage-Löschungen sonst durchs Raster fallen —
// eine gelöschte Datei ist eine Änderung an dem, was Besucher sehen.
const SCHREIBT = /\.(insert|update|delete|upsert|remove)\(|\.rpc\(/;
const PROTOKOLLIERT = /protokolliere\(/;
const BENUTZT_DATENBANK = /createServerSupabase|createPublicClient|createBrowserSupabase|protokolliere\(/;
const FUNKTION = /^export async function (\w+)/;

function dateienUnter(verzeichnis) {
  const treffer = [];
  for (const name of readdirSync(verzeichnis)) {
    if (name === "node_modules" || name === ".next") continue;
    const pfad = join(verzeichnis, name);
    if (statSync(pfad).isDirectory()) treffer.push(...dateienUnter(pfad));
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) treffer.push(pfad);
  }
  return treffer;
}

/** Zerlegt eine Datei in ihre exportierten async-Funktionen (über Klammertiefe). */
function funktionen(quelltext) {
  const zeilen = quelltext.split("\n");
  const gefunden = [];
  let i = 0;
  while (i < zeilen.length) {
    const treffer = FUNKTION.exec(zeilen[i]);
    if (!treffer) {
      i++;
      continue;
    }
    let tiefe = 0;
    let begonnen = false;
    let j = i;
    const koerper = [];
    while (j < zeilen.length) {
      const zeile = zeilen[j];
      koerper.push(zeile);
      tiefe += (zeile.match(/{/g) || []).length - (zeile.match(/}/g) || []).length;
      if (zeile.includes("{")) begonnen = true;
      if (begonnen && tiefe <= 0) break;
      j++;
    }
    gefunden.push({ name: treffer[1], zeile: i + 1, koerper: koerper.join("\n") });
    i = j + 1;
  }
  return gefunden;
}

const offen = [];
const unbenutzt = new Set(Object.keys(AUSNAHMEN));
let geprueft = 0;

for (const verzeichnis of VERZEICHNISSE) {
  for (const datei of dateienUnter(join(WURZEL, verzeichnis))) {
    const quelltext = readFileSync(datei, "utf8");
    // ⚠️ Geprüft wird jede Datei, die einen Supabase-Client anfasst — nicht nur
    // `'use server'`-Module. Beim ersten Lauf am 22.09.2026 fiel sonst genau die
    // Datei durchs Raster, die Besucher-Einwilligungen schreibt: Sie läuft im
    // Browser, hat kein `'use server'`, und schreibt trotzdem in die Datenbank.
    // Ein Abdeckungstest, der nur Server Actions kennt, ist blind für den
    // dritten Fall aus Pflichtkern Punkt 12 (Handlungen von Besuchern).
    if (!BENUTZT_DATENBANK.test(quelltext)) continue;
    const kurz = relative(WURZEL, datei);
    for (const fn of funktionen(quelltext)) {
      if (!SCHREIBT.test(fn.koerper)) continue;
      geprueft++;
      const schluessel = `${kurz}::${fn.name}`;
      if (PROTOKOLLIERT.test(fn.koerper)) {
        unbenutzt.delete(schluessel);
        continue;
      }
      if (schluessel in AUSNAHMEN) {
        unbenutzt.delete(schluessel);
        continue;
      }
      offen.push({ schluessel, datei: kurz, zeile: fn.zeile });
    }
  }
}

console.log(`${geprueft} schreibende Server-Funktionen geprüft.`);

if (offen.length > 0) {
  console.error(`\n✖ ${offen.length} schreibende Funktion(en) ohne Audit-Log und ohne Begründung:\n`);
  for (const e of offen) console.error(`   ${e.datei}:${e.zeile}  ${e.schluessel.split("::")[1]}`);
  console.error(`\nEntweder protokolliere() aufrufen — oder in scripts/audit-abdeckung.mjs`);
  console.error(`unter AUSNAHMEN eintragen, mit einer Begründung, die jemand lesen kann.`);
  process.exit(1);
}

if (unbenutzt.size > 0) {
  console.error(`\n✖ ${unbenutzt.size} Ausnahme(n) zeigen ins Leere — Funktion umbenannt, entfernt`);
  console.error(`  oder sie protokolliert inzwischen. Eintrag löschen:\n`);
  for (const s of unbenutzt) console.error(`   ${s}`);
  process.exit(1);
}

console.log(`✔ Jede schreibende Funktion protokolliert oder ist begründet (${Object.keys(AUSNAHMEN).length} Ausnahmen).`);
