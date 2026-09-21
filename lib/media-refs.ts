import type { createServerSupabase } from "@/lib/supabase/server";

/**
 * Wer zeigt auf welche Datei im Storage — an genau einer Stelle.
 *
 * Warum es diese Datei gibt: Datenbank und Storage sind zwei getrennte Systeme, und
 * nichts hält sie zusammen. Beide Richtungen gehen lautlos kaputt, und beide sind in
 * diesem Projekt schon passiert:
 *
 * 1. **Datei weg, Zeile bleibt.** Wird eine Datei im Supabase-Dashboard gelöscht,
 *    antwortet der Storage mit `NoSuchKey`, der Bild-Optimizer daraufhin mit 400, und
 *    die Website zeigt eine leere Fläche. Kein Build bricht, kein Test wird rot — nur
 *    eine rote Zeile in einer Konsole, in die niemand sieht. Am 21.09.2026 standen so
 *    zwei tote Verweise seit Wochen live (`gallery_items` und `show_images`).
 * 2. **Zeile weg, Datei bleibt.** Bis zum 21.09.2026 löschte nur `site-media.ts` die
 *    zugehörige Datei mit; jedes andere Löschen (Galerie, Show-Bild, Show-Video,
 *    Partner, Auftritt, Comedian) ließ sie im Storage liegen. Auf dem Free-Plan mit
 *    1 GB Kontingent ist das die Sorte Leck, die man erst bemerkt, wenn ein Upload
 *    scheitert.
 *
 * Die Registry unten ist die Antwort auf beides: `deleteFileIfUnused()` benutzt sie, um
 * vor dem Löschen ALLE Verweise zu prüfen, und `auditMedia()`, um beide Richtungen
 * sichtbar zu machen (Panel „Medien-Check" unter /admin/medien).
 *
 * ⚠️ **Neue Spalte mit einem Storage-Pfad → hier eine Zeile ergänzen.** Ohne sie hält
 * `deleteFileIfUnused()` eine noch benutzte Datei für verwaist und löscht sie, und der
 * Medien-Check meldet sie als verwaist. Der Test `tests/media-refs.test.ts` vergleicht
 * die Liste gegen die Spalten, die im Code tatsächlich als Pfad gelesen werden.
 */

/**
 * Buckets aus Migration 0001. Feste Liste statt `listBuckets()` — dafür bräuchte die
 * authentifizierte Rolle zusätzlich Leserechte auf `storage.buckets`.
 *
 * Steht hier und nicht in `storage-usage.ts`, obwohl die Speicher-Leiste sie zuerst
 * gebraucht hat: Diese Datei darf **nur typseitig** von Server-Code abhängen, damit
 * `tests/media-refs.test.ts` sie mit `node --test` direkt laden kann. Ein Wert-Import
 * aus `storage-usage.ts` zöge über `next/headers` den ganzen Server-Stapel mit.
 */
export const STORAGE_BUCKETS = ["media", "gallery", "planets"] as const;

type Client = Awaited<ReturnType<typeof createServerSupabase>>;

export interface MediaReference {
  table: string;
  column: string;
  /** Spalte, die den Datensatz für einen Menschen erkennbar macht (Bildunterschrift, Name, Titel). */
  labelColumn: string;
  /** Wie der Bereich im Admin heißt — Text im Medien-Check. */
  area: string;
  /** Wo man den Datensatz im Admin findet. */
  adminPath: string;
}

export const MEDIA_REFERENCES: MediaReference[] = [
  { table: "site_media", column: "file_path", labelColumn: "key", area: "Medien-Platz", adminPath: "/admin/medien" },
  { table: "gallery_items", column: "image_path", labelColumn: "caption", area: "Galerie", adminPath: "/admin/galerie" },
  { table: "show_images", column: "image_path", labelColumn: "alt_text", area: "Show-Bild", adminPath: "/admin/shows" },
  { table: "show_videos", column: "video_path", labelColumn: "title", area: "Show-Video", adminPath: "/admin/shows" },
  { table: "show_videos", column: "poster_path", labelColumn: "title", area: "Vorschaubild", adminPath: "/admin/shows" },
  { table: "shows", column: "planet_image_path", labelColumn: "name", area: "Planet", adminPath: "/admin/shows" },
  { table: "shows", column: "background_image_path", labelColumn: "name", area: "Show-Hintergrund", adminPath: "/admin/shows" },
  { table: "shows", column: "header_image_path", labelColumn: "name", area: "Show-Kopfbild", adminPath: "/admin/shows" },
  { table: "partners", column: "logo_path", labelColumn: "name", area: "Partner-Logo", adminPath: "/admin/partner" },
  { table: "appearances", column: "flyer_path", labelColumn: "title", area: "Auftritts-Flyer", adminPath: "/admin/auftritte" },
  { table: "comedians", column: "photo_path", labelColumn: "name", area: "Comedian-Foto", adminPath: "/admin/comedians" },
  { table: "social_media_items", column: "thumbnail_path", labelColumn: "title", area: "Social-Vorschaubild", adminPath: "/admin/social" },
];

/** Storage-Pfad "bucket/datei" in Bucket + Objektpfad zerlegen. Lokale Pfade ("/…") → null. */
export function splitStoragePath(path: string): { bucket: string; file: string } | null {
  if (!path || path.startsWith("/")) return null;
  const slash = path.indexOf("/");
  if (slash <= 0 || slash === path.length - 1) return null;
  return { bucket: path.slice(0, slash), file: path.slice(slash + 1) };
}

/**
 * Zeigt noch irgendein Datensatz auf diese Datei?
 *
 * `null` heißt **nicht sicher** (eine Abfrage ist fehlgeschlagen) und ist bewusst nicht
 * `false`: Wer beim Zählen scheitert, darf nicht löschen.
 */
export async function countReferences(supabase: Client, path: string): Promise<number | null> {
  const results = await Promise.all(
    MEDIA_REFERENCES.map((ref) =>
      supabase.from(ref.table).select(ref.column, { count: "exact", head: true }).eq(ref.column, path),
    ),
  );
  if (results.some((r) => r.error)) return null;
  return results.reduce((sum, r) => sum + (r.count ?? 0), 0);
}

/**
 * Löscht eine Datei aus dem Storage — aber nur, wenn kein Datensatz mehr auf sie zeigt.
 *
 * Fehler werden geschluckt: Aufrufer ist immer ein Löschen oder Ersetzen, das bereits
 * durch ist. Eine liegengebliebene Altdatei darf die Aktion nicht nachträglich scheitern
 * lassen — sie taucht dann im Medien-Check als verwaist auf.
 */
export async function deleteFileIfUnused(supabase: Client, path: string): Promise<void> {
  const target = splitStoragePath((path ?? "").trim());
  if (!target) return;
  try {
    const count = await countReferences(supabase, path.trim());
    if (count === null || count > 0) return;
    await supabase.storage.from(target.bucket).remove([target.file]);
  } catch {
    // still: siehe Kommentar oben.
  }
}

/** Mehrere Pfade auf einmal (Datensatz mit Video + Poster, Show mit drei Bildern). */
export async function deleteFilesIfUnused(supabase: Client, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.map((p) => (p ?? "").trim()).filter(Boolean))];
  for (const path of unique) await deleteFileIfUnused(supabase, path);
}

export interface DeadReference {
  area: string;
  table: string;
  column: string;
  label: string;
  path: string;
  adminPath: string;
}

export interface OrphanFile {
  bucket: string;
  file: string;
  bytes: number;
}

export interface MediaAudit {
  dead: DeadReference[];
  orphans: OrphanFile[];
  /** Buckets, die nicht gelesen werden konnten — dann ist das Ergebnis unvollständig. */
  failed: string[];
}

interface StorageEntry {
  path: string;
  bytes: number;
}

async function listBucket(supabase: Client, bucket: string, prefix = ""): Promise<StorageEntry[]> {
  const out: StorageEntry[] = [];
  const folders: string[] = [];
  for (let page = 0; page < 50; page++) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset: page * 1000,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Ordner liefert die API ohne `id` — dort rekursiv weitersuchen.
      if (!entry.id) folders.push(path);
      else out.push({ path, bytes: Number(entry.metadata?.size ?? 0) });
    }
    if (data.length < 1000) break;
  }
  for (const folder of folders) out.push(...(await listBucket(supabase, bucket, folder)));
  return out;
}

/**
 * Vergleicht beide Richtungen: Datensätze ohne Datei und Dateien ohne Datensatz.
 *
 * ⚠️ Ein Bucket, der sich nicht lesen lässt, landet in `failed` und **seine Dateien
 * werden nicht als verwaist gemeldet** — sonst stünde bei einem API-Aussetzer die halbe
 * Mediathek als Müll da. Aus demselben Grund gilt ein Verweis nur als tot, wenn sein
 * Bucket erfolgreich gelesen wurde.
 */
export async function auditMedia(supabase: Client): Promise<MediaAudit> {
  const listings = await Promise.all(
    STORAGE_BUCKETS.map(async (bucket) => {
      try {
        return { bucket, files: await listBucket(supabase, bucket), ok: true as const };
      } catch {
        return { bucket, files: [] as StorageEntry[], ok: false as const };
      }
    }),
  );

  const readable = new Set<string>(listings.filter((l) => l.ok).map((l) => l.bucket));
  const failed: string[] = listings.filter((l) => !l.ok).map((l) => l.bucket);
  const sizes = new Map<string, number>();
  for (const listing of listings) {
    for (const file of listing.files) sizes.set(`${listing.bucket}/${file.path}`, file.bytes);
  }

  const used = new Set<string>();
  const dead: DeadReference[] = [];

  for (const ref of MEDIA_REFERENCES) {
    // `select("*")`, nicht die zwei Spalten einzeln: Ein aus Variablen gebauter
    // Select-String bringt den Typparser von postgrest-js durcheinander. Die Tabellen
    // hier haben zweistellige Zeilenzahlen — der Unterschied ist nicht messbar.
    const { data, error } = await supabase.from(ref.table).select("*");
    // Eine nicht lesbare Tabelle macht jede ihrer Dateien scheinbar verwaist — deshalb
    // gilt hier dasselbe wie für einen nicht lesbaren Bucket: lieber nichts melden.
    if (error || !data) {
      failed.push(`${ref.table}.${ref.column}`);
      continue;
    }
    for (const row of data as Record<string, unknown>[]) {
      const path = String(row[ref.column] ?? "").trim();
      if (!path || path.startsWith("/")) continue;
      used.add(path);
      const target = splitStoragePath(path);
      if (!target || !readable.has(target.bucket)) continue;
      if (sizes.has(path)) continue;
      dead.push({
        area: ref.area,
        table: ref.table,
        column: ref.column,
        label: String(row[ref.labelColumn] ?? "").trim() || "(ohne Bezeichnung)",
        path,
        adminPath: ref.adminPath,
      });
    }
  }

  // Ein Verweis aus einer nicht lesbaren Tabelle fehlt in `used` — dann ist die
  // Verwaist-Liste nicht belastbar und bleibt leer.
  const tablesFailed = failed.some((f) => f.includes("."));
  const orphans: OrphanFile[] = tablesFailed
    ? []
    : listings
        .filter((l) => l.ok)
        .flatMap((l) =>
          l.files
            .filter((f) => !used.has(`${l.bucket}/${f.path}`))
            .map((f) => ({ bucket: l.bucket, file: f.path, bytes: f.bytes })),
        )
        .sort((a, b) => b.bytes - a.bytes);

  return { dead, orphans, failed };
}
