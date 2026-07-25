"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

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
    photo_path: String(formData.get("photo_path") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createComedian(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  let newId: string;
  try {
    const fields = comedianFields(formData);
    const { data, error } = await supabase.from("comedians").insert(fields).select("id").single();
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
    const { error } = await supabase.from("comedians").update(fields).eq("id", id);
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
