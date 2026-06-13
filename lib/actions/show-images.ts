"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

export async function addShowImage(
  showId: string,
  input: { imagePath: string; altText?: string; sortOrder?: number },
) {
  if (!input.imagePath) throw new Error("Bild-Pfad fehlt.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_images").insert({
    show_id: showId,
    image_path: input.imagePath,
    alt_text: (input.altText ?? "").trim(),
    sort_order: input.sortOrder ?? 0,
  });
  if (error) throw new Error(`Bild speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}

export async function deleteShowImage(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("show_images").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/shows/${showId}`);
}
