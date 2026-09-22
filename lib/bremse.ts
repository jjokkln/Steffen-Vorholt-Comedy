// Bremse für die Anmeldung und das Anfrageformular.
//
// ⚠️ Diese Datei hat bewusst KEIN 'use server'. Jede exportierte Funktion eines
// `'use server'`-Moduls ist ein aufrufbarer HTTP-Endpunkt, dessen Action-Id im
// Client-Bundle steht — eine Bremse, die man von außen aufrufen kann, ist keine.
// Sie wird nur aus Server Actions importiert; `headers()` gäbe es im Client
// ohnehin nicht.
//
// ── Warum die Kennung gehasht wird ─────────────────────────────────────────
//
// Die Zählfunktionen in der Datenbank sind für `anon` ausführbar — sie müssen es
// sein, weil eine Anmeldung und ein Anfrageformular anonym sind. Damit wäre der
// Zähler ohne Hash ein **Aussperr-Werkzeug**: Wer die Kennung kennt (eine
// E-Mail-Adresse errät man), sperrt gezielt jemanden aus, und für den
// Betroffenen sieht das wie ein kaputtes Login aus (Regel auth-haertung,
// Punkt 1).
//
// Deshalb ist die Kennung `sha256(BREMSE_GEHEIMNIS + ':' + art + ':' + wert)`.
// Das Geheimnis steht nur in der Server-Umgebung; eine fremde Kennung lässt sich
// ohne es nicht bilden. Nebeneffekt, der dazugehört: In der Tabelle steht
// niemals eine IP-Adresse oder eine E-Mail im Klartext.

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Die Bremsen dieses Projekts. Jede Art ist ein eigener Eimer — eine
 * ausgeschöpfte Anfrage-Quote sperrt also nicht die Anmeldung.
 */
export type BremsArt = "login_quelle" | "login_konto" | "anfrage_quelle";

/**
 * Grenzen, und warum sie so und nicht strenger sind.
 *
 * Die Randbedingung aus der Regel auth-haertung (Punkt 3) — „alle Mitarbeiter
 * eines Büros teilen eine öffentliche IP" — gilt hier in kleiner Form: Es gibt
 * drei Admin-Konten, und zwei davon können am selben Anschluss sitzen. Deshalb
 * zählen die Login-Bremsen nur **Fehl**versuche, und ein erfolgreicher Login
 * setzt beide Eimer zurück.
 *
 * Die Rechnung hinter `login_konto`: 10 Fehlversuche pro Stunde je Konto machen
 * aus einem Passwort mit 60 Bit Entropie eine Rateaufgabe für mehrere
 * Jahrtausende. Für jemanden, der sein eigenes Passwort dreimal vertippt,
 * bleiben sieben Versuche — und nach dem richtigen Versuch ist der Zähler leer.
 *
 * `login_quelle` liegt höher: Diese Bremse soll den Fall auffangen, dass jemand
 * viele verschiedene Adressen durchprobiert, ohne je ein Kontolimit zu reißen.
 */
const GRENZEN: Record<BremsArt, { max: number; fensterMinuten: number }> = {
  login_quelle: { max: 30, fensterMinuten: 60 },
  login_konto: { max: 10, fensterMinuten: 60 },
  // Das Anfrageformular verschickt zwei Mails je Absendung über Steffens
  // privates Gmail-Konto (Tageslimit ~500). 10 Anfragen pro Stunde aus einer
  // Quelle deckt jedes echte Verhalten ab — die Grenze je Adresse (5/Stunde)
  // liegt ohnehin in der Datenbank (Migration 0021).
  anfrage_quelle: { max: 10, fensterMinuten: 60 },
};

/**
 * Die anfragende IP, wie Vercel sie durchgibt.
 *
 * `x-forwarded-for` ist hinter Vercel vertrauenswürdig — der Proxy setzt den
 * Wert neu und hängt nicht an, was der Client behauptet.
 *
 * Fehlt der Kopf, wird `null` zurückgegeben und damit **nicht gezählt**. Eine
 * Sammelkennung wäre schlimmer als keine: Die erste Person, die sich vertippt,
 * sperrte alle anderen mit aus (Regel auth-haertung, Punkt 3).
 */
export async function anfragendeQuelle(): Promise<string | null> {
  const kopf = await headers();
  const wert = kopf.get("x-forwarded-for")?.split(",")[0]?.trim();
  return wert && wert.length > 0 ? wert : null;
}

/**
 * Bildet die Kennung. `null`, wenn kein Geheimnis gesetzt ist — dann wird nicht
 * gezählt, und der Aufrufer schreibt das ins Log.
 *
 * ⚠️ Ohne `BREMSE_GEHEIMNIS` wäre der Hash aus öffentlich bekannten Bestandteilen
 * gebildet und damit für jeden nachbaubar. Ein Standardwert im Code wäre deshalb
 * schlimmer als keine Bremse: Er sähe aus wie Schutz und wäre keiner.
 */
function kennung(art: BremsArt, wert: string | null): string | null {
  if (!wert) return null;
  const geheimnis = process.env.BREMSE_GEHEIMNIS;
  if (!geheimnis || geheimnis.length < 16) {
    console.error(
      "bremse: BREMSE_GEHEIMNIS fehlt oder ist zu kurz — es wird NICHT gebremst. " +
        "In der Vercel-Umgebung setzen (mindestens 32 zufällige Zeichen).",
    );
    return null;
  }
  return createHash("sha256").update(`${geheimnis}:${art}:${wert.toLowerCase()}`).digest("hex");
}

/**
 * Greift die Bremse bereits? Liest den Stand, **ohne** ihn zu erhöhen.
 *
 * ⚠️ Das ist der Unterschied zwischen einer Bremse und einer Selbstsperre:
 * Zählte schon die Vorabprüfung mit, verbrauchte jeder erfolgreiche Login
 * Budget, und Punkt 1 der Regel („nur Fehlversuche zählen") wäre wirkungslos.
 */
export async function bremseGreift(art: BremsArt, wert: string | null): Promise<boolean> {
  const k = kennung(art, wert);
  if (!k) return false;

  const { max, fensterMinuten } = GRENZEN[art];
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("bremse_stand", {
    p_kennung: k,
    p_art: art,
    p_fenster_minuten: fensterMinuten,
  });

  if (error) {
    // Fail-open, aber laut: Eine hustende Datenbank darf die Anmeldung nicht
    // lahmlegen — „die Bremse greift nicht" muss aber diagnostizierbar bleiben
    // (Regel supabase-sicherheit, Punkt 8).
    console.error(`bremse: Stand ${art} nicht lesbar:`, error.message);
    return false;
  }

  return typeof data === "number" && data >= max;
}

/**
 * Zählt einen Fehlversuch. Urteilt bewusst nicht.
 *
 * Das Urteil fällt beim **nächsten** Versuch (`bremseGreift`). Wer gerade seinen
 * letzten Versuch verbraucht hat, soll die normale Meldung sehen und nicht eine
 * andere, die einem Angreifer verrät, dass er eine Grenze gefunden hat.
 */
export async function fehlversuchZaehlen(art: BremsArt, wert: string | null): Promise<void> {
  const k = kennung(art, wert);
  if (!k) return;

  const { fensterMinuten } = GRENZEN[art];
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("bremse_zaehlen", {
    p_kennung: k,
    p_art: art,
    p_fenster_minuten: fensterMinuten,
  });

  if (error) {
    console.error(`bremse: Zähler ${art} fehlgeschlagen:`, error.message);
    return;
  }

  // -1 kommt aus der Obergrenze in Migration 0031: Das Fenster ist überfüllt,
  // es wird gerade nicht gebremst. Das ist ein Angriffsindikator und gehört
  // deshalb in den Log, auch wenn nichts abbricht.
  if (data === -1) {
    console.error(
      `bremse: Zählerfenster für ${art} ist voll (>5000 Kennungen) — es wird gerade NICHT gebremst.`,
    );
  }
}

/**
 * Leert den Eimer nach einem erfolgreichen Versuch, damit eine vertippte
 * Eingabe kein Budget kostet.
 */
export async function zuruecksetzen(art: BremsArt, wert: string | null): Promise<void> {
  const k = kennung(art, wert);
  if (!k) return;

  const supabase = createPublicClient();
  const { error } = await supabase.rpc("bremse_zuruecksetzen", { p_kennung: k, p_art: art });
  if (error) console.error(`bremse: Zurücksetzen ${art} fehlgeschlagen:`, error.message);
}
