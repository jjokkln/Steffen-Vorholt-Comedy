"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { revalidatePath } from "next/cache";

export async function addGalleryItem(formData: FormData) {
  const supabase = await createServerSupabase();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("Bild ist Pflicht.");
  const ext = file.name.split(".").pop() || "webp";
  const path = `mission-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, { contentType: file.type });
  if (upErr) throw new Error(`Upload fehlgeschlagen: ${upErr.message}`);
  const { error } = await supabase.from("gallery_items").insert({
    image_path: `gallery/${path}`,
    caption: String(formData.get("caption") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
  });
  if (error) throw new Error(`Galerie-Eintrag fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}

export async function updateGalleryItem(id: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("gallery_items").update({
    caption: String(formData.get("caption") ?? "").trim(),
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

export async function replaceHeroVideo(formData: FormData) {
  const supabase = await createServerSupabase();
  const file = formData.get("video") as File | null;
  if (!file || file.size === 0) throw new Error("Video ist Pflicht.");
  const path = `hero-${Date.now()}.mp4`;
  const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: "video/mp4" });
  if (upErr) throw new Error(`Video-Upload fehlgeschlagen: ${upErr.message}`);
  const { error } = await supabase.from("site_media").upsert({ key: "hero_video", file_path: `media/${path}`, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Video speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/galerie");
}
