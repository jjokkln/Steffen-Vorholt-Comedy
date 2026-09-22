"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";
import { siteMediaSlot } from "@/lib/site-media";
import { deleteFileIfUnused } from "@/lib/media-refs";
import { protokolliere } from "@/lib/audit";

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
  if (old && old !== path) await deleteFileIfUnused(supabase, old);

  await protokolliere({
    aktion: "hochgeladen",
    objekt: "medium",
    objektId: key,
    bezeichnung: siteMediaSlot(key)?.label ?? key,
    details: { ersetzt: Boolean(old && old !== path) },
  });
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
  if (old) await deleteFileIfUnused(supabase, old);

  // Paarweise zu `setSiteMediaPath`: Das Leeren eines Platzes nimmt ein Bild
  // oder Video von der Website, ohne dass irgendwo ein Fehler entsteht.
  await protokolliere({
    aktion: "geleert",
    objekt: "medium",
    objektId: key,
    bezeichnung: siteMediaSlot(key)?.label ?? key,
  });
  revalidatePublic();
  revalidatePath("/admin/medien");
}
