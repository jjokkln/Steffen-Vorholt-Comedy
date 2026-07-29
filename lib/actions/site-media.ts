"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";
import { siteMediaSlot } from "@/lib/site-media";

/** Storage-Pfad "bucket/datei" in Bucket + Objektpfad zerlegen. Lokale Pfade ("/...") -> null. */
function splitStoragePath(path: string): { bucket: string; file: string } | null {
  if (!path || path.startsWith("/")) return null;
  const slash = path.indexOf("/");
  if (slash <= 0 || slash === path.length - 1) return null;
  return { bucket: path.slice(0, slash), file: path.slice(slash + 1) };
}

/**
 * Löscht eine ersetzte Datei aus dem Storage — aber nur, wenn kein anderer Datensatz
 * mehr auf sie zeigt. Bei 1 GB Kontingent wäre die Alternative, dass jeder Austausch
 * eines Trailers dauerhaft ein paar hundert MB Altlast liegen lässt.
 *
 * Fehler werden bewusst geschluckt: Der neue Pfad ist zu diesem Zeitpunkt schon
 * gespeichert, und eine nicht gelöschte Altdatei darf den Upload nicht scheitern lassen.
 */
async function deleteOrphanedFile(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  path: string,
) {
  const target = splitStoragePath(path);
  if (!target) return;
  try {
    const checks = await Promise.all([
      supabase.from("site_media").select("key", { count: "exact", head: true }).eq("file_path", path),
      supabase.from("gallery_items").select("id", { count: "exact", head: true }).eq("image_path", path),
      supabase.from("show_videos").select("id", { count: "exact", head: true }).eq("video_path", path),
      supabase.from("show_videos").select("id", { count: "exact", head: true }).eq("poster_path", path),
      supabase.from("show_images").select("id", { count: "exact", head: true }).eq("image_path", path),
    ]);
    // Eine fehlgeschlagene Prüfung heißt „nicht sicher" -> Datei bleibt liegen.
    if (checks.some((c) => c.error)) return;
    if (checks.some((c) => (c.count ?? 0) > 0)) return;
    await supabase.storage.from(target.bucket).remove([target.file]);
  } catch {
    // still: siehe Kommentar oben.
  }
}

/**
 * Speichert den Pfad einer bereits per Direkt-Upload hochgeladenen Datei für einen
 * Medien-Platz (Registry: lib/site-media.ts) und räumt die vorherige Datei weg.
 */
export async function setSiteMediaPath(key: string, path: string) {
  if (!siteMediaSlot(key)) throw new Error(`Unbekannter Medien-Platz: ${key}`);
  if (!path) throw new Error("Datei-Pfad fehlt.");

  const supabase = await createServerSupabase();
  const { data: previous } = await supabase
    .from("site_media").select("file_path").eq("key", key).maybeSingle();

  const { error } = await supabase.from("site_media").upsert({
    key,
    file_path: path,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);

  const old = (previous?.file_path ?? "").trim();
  if (old && old !== path) await deleteOrphanedFile(supabase, old);

  revalidatePublic();
  revalidatePath("/admin/medien");
}

/**
 * Leert einen Platz: die Website fällt damit auf die Fallback-Kette zurück
 * (anderer Platz oder die mitgelieferte Datei aus public/).
 */
export async function clearSiteMediaPath(key: string) {
  if (!siteMediaSlot(key)) throw new Error(`Unbekannter Medien-Platz: ${key}`);

  const supabase = await createServerSupabase();
  const { data: previous } = await supabase
    .from("site_media").select("file_path").eq("key", key).maybeSingle();

  const { error } = await supabase.from("site_media").upsert({
    key,
    file_path: "",
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Zurücksetzen fehlgeschlagen: ${error.message}`);

  const old = (previous?.file_path ?? "").trim();
  if (old) await deleteOrphanedFile(supabase, old);

  revalidatePublic();
  revalidatePath("/admin/medien");
}
