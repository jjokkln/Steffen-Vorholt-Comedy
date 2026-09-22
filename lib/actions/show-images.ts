"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";
import { deleteFilesIfUnused } from "@/lib/media-refs";
import { protokolliere } from "@/lib/audit";

export async function addShowImage(
  showId: string,
  input: { imagePath: string; altText?: string; category?: string; sortOrder?: number },
) {
  if (!input.imagePath) throw new Error("Bild-Pfad fehlt.");
  const supabase = await createServerSupabase();
  const category = input.category === "location" ? "location" : "show";
  const { data, error } = await supabase.from("show_images").insert({
    show_id: showId,
    image_path: input.imagePath,
    alt_text: (input.altText ?? "").trim(),
    category,
    sort_order: input.sortOrder ?? 0,
  }).select("id").single();
  if (error) throw new Error(`Bild speichern fehlgeschlagen: ${error.message}`);
  await protokolliere({
    aktion: "hochgeladen",
    objekt: "show_bild",
    objektId: data.id as string,
    bezeichnung: (input.altText ?? "").trim() || null,
    details: { show: showId, kategorie: category },
  });
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}

export async function deleteShowImage(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from("show_images").select("image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("show_images").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  await deleteFilesIfUnused(supabase, [row?.image_path]);
  await protokolliere({ aktion: "geloescht", objekt: "show_bild", objektId: id, details: { show: showId } });
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}
