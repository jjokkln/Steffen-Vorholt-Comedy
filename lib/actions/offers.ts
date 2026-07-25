"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

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
    image_path: String(formData.get("image_path") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = offerFields(formData);
    const { error } = await supabase.from("offers").insert(fields);
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
    const { error } = await supabase.from("offers").update(fields).eq("id", id);
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
