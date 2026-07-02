"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

async function uploadPhoto(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `comedian-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Foto-Upload fehlgeschlagen: ${error.message}`);
  return `media/${path}`;
}

function comedianFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name ist Pflicht.");
  const ageRaw = String(formData.get("age") ?? "").trim();
  return {
    name,
    age: ageRaw ? Number(ageRaw) : null,
    bio: String(formData.get("bio") ?? "").trim(),
    instagram_url: String(formData.get("instagram_url") ?? "").trim(),
    tiktok_url: String(formData.get("tiktok_url") ?? "").trim(),
    youtube_url: String(formData.get("youtube_url") ?? "").trim(),
    website_url: String(formData.get("website_url") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createComedian(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  let newId: string;
  try {
    const fields = comedianFields(formData);
    const photoPath = await uploadPhoto(supabase, formData.get("photo") as File | null);
    const { data, error } = await supabase.from("comedians").insert({
      ...fields,
      photo_path: photoPath ?? "",
    }).select("id").single();
    if (error) throw new Error(error.message);
    newId = data.id as string;
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect(`/admin/comedians/${newId}`);
}

export async function updateComedian(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = comedianFields(formData);
    const update: Record<string, unknown> = { ...fields };
    const photoPath = await uploadPhoto(supabase, formData.get("photo") as File | null);
    if (photoPath) update.photo_path = photoPath;
    const { error } = await supabase.from("comedians").update(update).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath(`/admin/comedians/${id}`);
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteComedian(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("comedians").delete().eq("id", id);
  if (error) throw new Error(`Comedian löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/comedians");
}
