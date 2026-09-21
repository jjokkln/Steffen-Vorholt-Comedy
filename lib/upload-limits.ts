// Relativ und mit Endung statt "@/lib/storage-format": `npm test` läuft über
// node --test mit Type-Stripping und kennt weder den tsconfig-Alias noch
// endungslose Pfade (siehe lib/social.ts).
import { formatBytes } from "./storage-format.ts";

/**
 * Grenzen und Fehlertexte des Datei-Uploads — bewusst ohne Supabase-Import, damit
 * lib/upload.ts als Einziges den Storage-Client zieht und diese Regeln testbar bleiben.
 */

/**
 * Obergrenze pro Datei — muss mit `file_size_limit` der Buckets `media`, `gallery` und
 * `planets` übereinstimmen (Migration 0022, 52428800 Byte = 50 MiB).
 *
 * ⚠️ Die Grenze steht an ZWEI Stellen: hier und in der Datenbank. Wer sie dort ändert,
 * ändert sie hier mit — sonst meldet der Browser eine Grenze, die nicht mehr gilt.
 * Der Wert hier ist nur die freundliche Vorab-Auskunft; durchgesetzt wird sie im Storage.
 */
export const MAX_UPLOAD_BYTES = 52_428_800;

/**
 * Erklärt in einem Satz, warum eine Datei zu groß ist — mit echter und erlaubter Größe.
 * Bewusst zentral: Bis 21.09.2026 lief eine Überschreitung als
 * „Upload fehlgeschlagen: <Rohtext von Supabase>" durch, in dem das Wort „groß" nicht
 * vorkam. Lenny sah nur „Fehler beim Upload des Videos" und hatte keinen Anhaltspunkt.
 */
export function tooLargeMessage(bytes: number): string {
  return (
    `Die Datei ist ${formatBytes(bytes)} groß — erlaubt sind höchstens ` +
    `${formatBytes(MAX_UPLOAD_BYTES)} pro Datei. Kürze das Video oder exportiere es ` +
    `kleiner (1080p reichen), dann klappt der Upload.`
  );
}

/** Liegt die Datei über der Grenze? Für die Sofort-Rückmeldung schon bei der Auswahl. */
export function isTooLarge(file: { size: number }): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

/**
 * `MediaRecorder` liefert Typen wie `video/mp4;codecs="avc1.4d002a,mp4a.40.2"`. Die
 * `allowed_mime_types` der Buckets (Migration 0022) listen aber die nackten Typen —
 * mit Codec-Zusatz weist der Storage die Datei als unerlaubten Typ ab. Also den
 * Parameter abschneiden, bevor er als Content-Type mitgeht.
 */
export function plainContentType(type: string): string | undefined {
  const bare = type.split(";")[0]?.trim().toLowerCase();
  return bare || undefined;
}

/**
 * Übersetzt die Storage-Antwort in einen Satz, der dem Redakteur sagt, was zu tun ist.
 * Supabase meldet die Überschreitung je nach Weg als 413, als „exceeded the maximum
 * allowed size" oder — wenn das Gateway die Verbindung vorher kappt — nur als
 * abgebrochener Netzwerk-Request. Alle drei bedeuten dasselbe.
 */
export function explainUploadError(error: unknown, file: { size: number; type?: string }): string {
  const message = (error as { message?: string })?.message ?? "";
  const status = String(
    (error as { statusCode?: string | number })?.statusCode ??
      (error as { status?: number })?.status ??
      "",
  );
  const text = message.toLowerCase();

  if (status === "413" || text.includes("maximum allowed size") || text.includes("too large")) {
    return tooLargeMessage(file.size);
  }
  // Ein Abbruch ohne Antwort bei einer Datei über der Grenze ist derselbe Fall: Das
  // Gateway schließt die Verbindung, bevor Supabase überhaupt antworten kann.
  if (isTooLarge(file)) return tooLargeMessage(file.size);

  if (text.includes("mime type") || text.includes("content type")) {
    return (
      `Dieses Dateiformat nimmt der Speicher nicht an (${file.type || "unbekannt"}). ` +
      `Erlaubt sind JPEG, PNG, WebP, AVIF, GIF sowie MP4, WebM und MOV.`
    );
  }
  return `Upload fehlgeschlagen: ${message || "unbekannter Fehler"}`;
}
