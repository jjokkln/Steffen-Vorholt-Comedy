import { createBrowserSupabase } from "@/lib/supabase/browser";
import { explainUploadError, isTooLarge, plainContentType, tooLargeMessage } from "@/lib/upload-limits";

export { MAX_UPLOAD_BYTES, isTooLarge, tooLargeMessage } from "@/lib/upload-limits";

/**
 * Lädt eine Datei direkt vom Browser in einen Supabase-Storage-Bucket.
 * Umgeht die Body-Limits von Next.js-Server-Actions (1 MB) und Vercel (~4,5 MB),
 * daher die richtige Methode für große Dateien wie Videos.
 * Gibt den Storage-Pfad "bucket/datei" zurück (kompatibel mit mediaUrl()).
 *
 * Grenzen und Fehlertexte stehen in lib/upload-limits.ts — die Datei hier ist die
 * einzige, die den Storage-Client zieht.
 */
/**
 * Ein Jahr Browser-Cache. Supabase setzt ohne Angabe nur `max-age=3600` — Besucher haben
 * damit Videos und Bilder stündlich neu geladen, was das Cached-Egress-Kontingent
 * gesprengt hat. Unbedenklich, weil jeder Dateiname einen Zeitstempel plus Zufallssuffix
 * trägt und `upsert:false` ein Überschreiben ausschließt: Eine URL zeigt für immer auf
 * denselben Inhalt.
 */
const CACHE_ONE_YEAR = "31536000";

export async function uploadToStorage(bucket: string, prefix: string, file: File): Promise<string> {
  // Vor dem Netzwerk prüfen, nicht danach: Ein 300-MB-Video braucht Minuten, bis der
  // Storage es ablehnt — und der Redakteur sieht in dieser Zeit nur „Lädt hoch…".
  if (isTooLarge(file)) throw new Error(tooLargeMessage(file.size));

  const supabase = createBrowserSupabase();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${prefix}-${Date.now()}-${rand}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: plainContentType(file.type),
    cacheControl: CACHE_ONE_YEAR,
    upsert: false,
  });
  if (error) throw new Error(explainUploadError(error, file));
  return `${bucket}/${path}`;
}
