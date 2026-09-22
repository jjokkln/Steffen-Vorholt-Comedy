/**
 * Nachweis erteilter und widerrufener Einwilligungen (Art. 7 Abs. 1 DSGVO).
 *
 * ── Warum es das gibt ──────────────────────────────────────────────────────
 *
 * Bis zum 22.09.2026 lag die Einwilligung ausschließlich im `localStorage` des
 * Besuchers. `CookieConsentProvider` nennt in seinem Kommentar Art. 7 Abs. 1 als
 * Grund für den Zeitstempel — ein Datum auf dem Gerät des Betroffenen ist aber
 * kein Nachweis, den der Verantwortliche führen kann: Er ist weder abfragbar
 * noch zählbar und verschwindet mit dem Leeren des Browsers
 * (Pflichtkern Punkt 12, Fall 3).
 *
 * ── Was NICHT gespeichert wird ─────────────────────────────────────────────
 *
 * Keine IP, kein User-Agent, keine URL. Für den Nachweis gebraucht werden: wann,
 * worin eingewilligt wurde (Version und Kategorien) und was entschieden wurde.
 * Die Zuordnung läuft über eine im Browser erzeugte Zufallszahl ohne
 * Personenbezug — sie beantwortet die einzige Frage, für die eine Zuordnung
 * nötig ist: „wurde dieselbe Einwilligung später widerrufen".
 *
 * ⚠️ Diese Datei läuft im Browser und schreibt über eine `security definer`-
 * Funktion, die `created_at` selbst setzt. Ein direkter Insert wäre der Fehler
 * aus supabase-sicherheit Punkt 18: Eine offene INSERT-Policy sagt, WER
 * schreiben darf, nie WELCHE SPALTEN — jemand könnte den Zeitstempel
 * rückdatieren und damit einen Nachweis fälschen, der später gegen uns
 * verwendet wird.
 */

import { createBrowserSupabase } from "@/lib/supabase/browser";

const KENNUNG_KEY = "sv_besucher";

export type Entscheidung = "erteilt" | "abgelehnt" | "widerrufen";

/**
 * Holt die Besucher-Kennung oder legt eine an. Reine Zufallszahl, kein
 * Fingerabdruck: Wer seinen Speicher leert, bekommt eine neue, und aus ihr
 * lässt sich nichts über die Person ableiten.
 */
function besucherKennung(): string | null {
  try {
    const vorhanden = localStorage.getItem(KENNUNG_KEY);
    if (vorhanden && vorhanden.length >= 8) return vorhanden;
    const neu = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    localStorage.setItem(KENNUNG_KEY, neu);
    return neu;
  } catch {
    // Privater Modus oder blockierter Speicher: Dann gibt es keine Kennung und
    // damit keinen Nachweis. Das ist der richtige Ausgang — eine erfundene
    // Kennung wäre ein Nachweis über jemand anderen.
    return null;
  }
}

/**
 * Hält eine Entscheidung fest. Läuft absichtlich „nebenher": Ein Bannerklick
 * darf nicht auf die Datenbank warten und erst recht nicht an ihr scheitern.
 */
export async function einwilligungNachweisen(
  entscheidung: Entscheidung,
  bannerVersion: number,
  kategorien: Record<string, boolean>,
): Promise<void> {
  const kennung = besucherKennung();
  if (!kennung) return;

  try {
    const supabase = createBrowserSupabase();
    const { error } = await supabase.rpc("einwilligung_nachweisen", {
      p_entscheidung: entscheidung,
      p_banner_version: bannerVersion,
      p_kategorien: kategorien,
      p_besucher_kennung: kennung,
    });
    if (error) console.error("[einwilligung] Nachweis fehlgeschlagen:", error.message);
  } catch (e) {
    console.error("[einwilligung] Nachweis fehlgeschlagen:", e);
  }
}
