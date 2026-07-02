"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

async function uploadPoster(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `offer-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Bild-Upload fehlgeschlagen: ${error.message}`);
  return `media/${path}`;
}

function offerFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel ist Pflicht.");
  return {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    validity: String(formData.get("validity") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = offerFields(formData);
    const imagePath = await uploadPoster(supabase, formData.get("image") as File | null);
    const { error } = await supabase.from("offers").insert({ ...fields, image_path: imagePath ?? "" });
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect("/admin/angebote");
}

export async function updateOffer(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = offerFields(formData);
    const update: Record<string, unknown> = { ...fields };
    const imagePath = await uploadPoster(supabase, formData.get("image") as File | null);
    if (imagePath) update.image_path = imagePath;
    const { error } = await supabase.from("offers").update(update).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath("/admin/angebote");
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteOffer(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw new Error(`Angebot löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/angebote");
}
