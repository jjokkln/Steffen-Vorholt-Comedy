"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

/** Speichert ein bereits per Direkt-Upload (mit Zuschnitt) hochgeladenes Galeriefoto. */
export async function addGalleryItem(input: {
  imagePath: string;
  caption: string;
  category: string;
  sortOrder: number;
}) {
  if (!input.imagePath) throw new Error("Bild ist Pflicht.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("gallery_items").insert({
    image_path: input.imagePath,
    caption: input.caption.trim(),
    category: input.category.trim(),
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(`Galerie-Eintrag fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

export async function updateGalleryItem(id: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("gallery_items").update({
    caption: String(formData.get("caption") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  }).eq("id", id);
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

export async function deleteGalleryItem(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

/** Speichert den Pfad eines bereits per Direkt-Upload hochgeladenen Hero-Videos. */
export async function setHeroVideoPath(path: string) {
  if (!path) throw new Error("Video-Pfad fehlt.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("site_media").upsert({ key: "hero_video", file_path: path, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Video speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}
