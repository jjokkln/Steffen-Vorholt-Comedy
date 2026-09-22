// Audit-Log schreiben — bewusst KEIN 'use server'-Modul.
//
// Jede exportierte Funktion eines `'use server'`-Moduls ist ein aufrufbarer
// HTTP-Endpunkt, dessen Action-Id im Client-Bundle steht. Eine Protokollfunktion
// als Server Action wäre ein offener Schreibkanal ins Protokoll — erfundene
// Aktionen, erfundene Objekte. Ein normales Modul erzwingt das Gegenteil:
// importierbar von Server Actions, von außen nicht erreichbar
// (Pflichtkern Punkt 12, Eigenschaft 1).
//
// Wer gehandelt hat, steht hier nirgends: Die SQL-Funktion `public.audit_schreiben`
// nimmt den Handelnden aus `auth.uid()`. Eine fremde Nutzer-Id lässt sich damit
// nicht angeben — sie ist kein Parameter. Die Funktion verlangt zusätzlich Admin,
// und die Tabelle hat NUR eine SELECT-Policy: Ein geschriebener Eintrag lässt
// sich weder ändern noch löschen, auch nicht von dem, der ihn ausgelöst hat.

import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Was passiert ist. Absichtlich eine kleine, objektunabhängige Liste statt
 * `show_angelegt | show_geaendert | termin_angelegt | …` — sonst hätte diese
 * Union bei 17 Objektarten über fünfzig Einträge, und niemand pflegt sie.
 *
 * ⚠️ **Paarweise denken** (Pflichtkern Punkt 12): Die Rücknahme sieht aus wie das
 * Besondere und wird zuerst protokolliert; die Handlung ist die wichtigere
 * Hälfte. Deshalb gibt es `veroeffentlicht` UND `zurueckgezogen`, `hochgeladen`
 * UND `geleert`.
 */
export type AuditAktion =
  | "angelegt"
  | "geaendert"
  | "geloescht"
  | "veroeffentlicht"
  | "zurueckgezogen"
  | "hochgeladen"
  | "geleert"
  | "status_geaendert"
  | "zugeordnet"
  | "entzogen";

/** Woran. Eine Art je Tabelle, die über die Verwaltungsfläche änderbar ist. */
export type AuditObjekt =
  | "show"
  | "termin"
  | "standort"
  | "galeriebild"
  | "comedian"
  | "partner"
  | "gastauftritt"
  | "angebot"
  | "anfrage"
  | "rechtstext"
  | "einstellung"
  | "medium"
  | "social_eintrag"
  | "youtube_referenz"
  | "show_bild"
  | "show_video"
  | "oneliner";

/**
 * Beschriftungen für die Anzeige.
 *
 * ⚠️ Beide Tabellen sind über ihre Union typisiert (`Record<AuditAktion, string>`).
 * Das ist der Punkt, nicht die Kosmetik: Eine neue Aktion ohne Beschriftung ist
 * damit ein **Typfehler** und keine hässliche Anzeige
 * (Pflichtkern Punkt 12, Eigenschaft 2).
 */
export const AKTION_BESCHRIFTUNG: Record<AuditAktion, string> = {
  angelegt: "angelegt",
  geaendert: "geändert",
  geloescht: "gelöscht",
  veroeffentlicht: "veröffentlicht",
  zurueckgezogen: "zurückgezogen",
  hochgeladen: "hochgeladen",
  geleert: "geleert",
  status_geaendert: "Status geändert",
  zugeordnet: "zugeordnet",
  entzogen: "entzogen",
};

export const OBJEKT_BESCHRIFTUNG: Record<AuditObjekt, string> = {
  show: "Show",
  termin: "Termin",
  standort: "Spielort",
  galeriebild: "Galeriebild",
  comedian: "Comedian",
  partner: "Partner",
  gastauftritt: "Gastauftritt",
  angebot: "Angebot",
  anfrage: "Anfrage",
  rechtstext: "Rechtstext",
  einstellung: "Einstellung",
  medium: "Medien-Platz",
  social_eintrag: "Social-Eintrag",
  youtube_referenz: "YouTube-Referenz",
  show_bild: "Show-Bild",
  show_video: "Show-Video",
  oneliner: "Buzzer-Spruch",
};

export interface AuditEintrag {
  aktion: AuditAktion;
  objekt: AuditObjekt;
  /**
   * Der Datensatz, um den es geht. Pflicht — ein Protokolleintrag ohne Ziel
   * beantwortet die Frage nicht, für die er geschrieben wurde. Bei Objekten mit
   * festem Schlüssel (Rechtstexte, Einstellungen, Medien-Plätze) ist das der
   * Slug bzw. der Schlüssel, sonst die UUID.
   */
  objektId: string;
  /**
   * Wie das Objekt hieß, als gehandelt wurde. Eine Beschriftung, KEINE
   * Zuordnung — nach dem Löschen einer Show ist `objektId` eine Nummer, an die
   * sich niemand erinnert.
   */
  bezeichnung?: string | null;
  /**
   * Kontext, sparsam. ⚠️ Ein Protokoll ist selbst eine Verarbeitung: Hier gehört
   * hinein, WAS sich geändert hat — keine ganzen Formularinhalte, keine
   * IP-Adressen, keine Standortdaten „weil man sie gerade hat"
   * (Pflichtkern Punkt 12, Warnkasten).
   */
  details?: Record<string, string | number | boolean | null> | null;
}

/**
 * Schreibt einen Protokolleintrag.
 *
 * Nur aus Server Actions aufrufen, die die Berechtigung bereits geprüft haben —
 * die SQL-Funktion prüft zwar selbst auf Admin, aber das ist die zweite Schicht,
 * nicht die erste.
 *
 * Fehler werden geschluckt und geloggt: Ein fehlgeschlagenes Protokoll darf die
 * Handlung nicht abbrechen. Die Umkehrung wäre schlimmer — eine Website, die
 * sich nicht mehr bedienen lässt, weil eine Protokollzeile klemmt.
 */
export async function protokolliere(eintrag: AuditEintrag): Promise<void> {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("audit_schreiben", {
      p_aktion: eintrag.aktion,
      p_objekt: eintrag.objekt,
      p_objekt_id: eintrag.objektId,
      p_bezeichnung: eintrag.bezeichnung ?? null,
      p_details: eintrag.details ?? null,
    });
    if (error) console.error("[audit] Protokolleintrag fehlgeschlagen:", error.message);
  } catch (e) {
    console.error("[audit] Protokolleintrag fehlgeschlagen:", e);
  }
}
