import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Belegter Storage-Platz, aufgeschlüsselt pro Bucket.
 *
 * Zweck: Auf dem Free-Plan ist der Platz endlich, und Videos füllen ihn schnell. Die
 * Leiste im Admin soll zeigen, wie es steht, BEVOR ein Upload scheitert.
 *
 * Ermittelt über die Storage-API (nicht per SQL): `storage.objects` liegt nicht im
 * PostgREST-Schema, die Tabelle ist von der Anwendung aus nur über die API erreichbar.
 */

/** Buckets aus Migration 0001. Feste Liste statt `listBuckets()` — dafür bräuchte die
 *  authentifizierte Rolle zusätzlich Leserechte auf `storage.buckets`. */
export const STORAGE_BUCKETS = ["media", "gallery", "planets"] as const;

/**
 * Kontingent in GB, überschreibbar per `STORAGE_QUOTA_GB`.
 *
 * ACHTUNG: Der Supabase-Free-Plan enthält 1 GB Datei-Storage; die 5 GB sind das
 * Egress-Kontingent (ausgelieferte Datenmenge pro Monat). Der Startwert hier ist 5,
 * weil die Leiste so angefordert wurde — wer den echten Storage-Deckel sehen will,
 * setzt `STORAGE_QUOTA_GB=1`.
 */
export const STORAGE_QUOTA_BYTES =
  Math.max(0.1, Number(process.env.STORAGE_QUOTA_GB) || 5) * 1024 * 1024 * 1024;

const PAGE_SIZE = 1000;
/** Schutz gegen Endlosschleifen bei unerwarteten API-Antworten. */
const MAX_PAGES_PER_FOLDER = 50;

export interface BucketUsage {
  bucket: string;
  bytes: number;
  files: number;
  /** Größte Einzeldateien — praktisch beim Aufräumen. */
  largest: { name: string; bytes: number }[];
}

export interface StorageUsage {
  bytes: number;
  files: number;
  quotaBytes: number;
  /** 0 … 1 (kann > 1 werden, wenn das Kontingent überschritten ist). */
  ratio: number;
  buckets: BucketUsage[];
  /** Buckets, die nicht gelesen werden konnten — dann ist die Summe unvollständig. */
  failed: string[];
}

type Client = Awaited<ReturnType<typeof createServerSupabase>>;

interface FileEntry {
  name: string;
  bytes: number;
}

async function listBucketFiles(supabase: Client, bucket: string, prefix = ""): Promise<FileEntry[]> {
  const files: FileEntry[] = [];
  const folders: string[] = [];

  for (let page = 0; page < MAX_PAGES_PER_FOLDER; page++) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(error.message);
    if (!data?.length) break;

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      // Ordner liefert die API ohne `id`/`metadata` — dort muss rekursiv weitergesucht werden.
      if (!entry.id) folders.push(path);
      else files.push({ name: path, bytes: Number(entry.metadata?.size ?? 0) });
    }
    if (data.length < PAGE_SIZE) break;
  }

  for (const folder of folders) {
    files.push(...(await listBucketFiles(supabase, bucket, folder)));
  }
  return files;
}

export async function getStorageUsage(): Promise<StorageUsage> {
  const supabase = await createServerSupabase();

  const results = await Promise.all(
    STORAGE_BUCKETS.map(async (bucket) => {
      try {
        const files = await listBucketFiles(supabase, bucket);
        const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
        const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 5)
          .map((file) => ({ name: file.name, bytes: file.bytes }));
        return { usage: { bucket, bytes, files: files.length, largest }, failed: false as const };
      } catch {
        return { usage: { bucket, bytes: 0, files: 0, largest: [] }, failed: true as const };
      }
    }),
  );

  const buckets = results.map((r) => r.usage).sort((a, b) => b.bytes - a.bytes);
  const bytes = buckets.reduce((sum, b) => sum + b.bytes, 0);
  const files = buckets.reduce((sum, b) => sum + b.files, 0);

  return {
    bytes,
    files,
    quotaBytes: STORAGE_QUOTA_BYTES,
    ratio: STORAGE_QUOTA_BYTES > 0 ? bytes / STORAGE_QUOTA_BYTES : 0,
    buckets,
    failed: results.filter((r) => r.failed).map((r) => r.usage.bucket),
  };
}
