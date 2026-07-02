"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

async function uploadLogo(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  file: File | null,
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `partner-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Logo-Upload fehlgeschlagen: ${error.message}`);
  return `media/${path}`;
}

function partnerFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name ist Pflicht.");
  return {
    name,
    url: String(formData.get("url") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createPartner(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = partnerFields(formData);
    const logoPath = await uploadLogo(supabase, formData.get("logo") as File | null);
    const { error } = await supabase.from("partners").insert({ ...fields, logo_path: logoPath ?? "" });
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect("/admin/partner");
}

export async function updatePartner(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = partnerFields(formData);
    const update: Record<string, unknown> = { ...fields };
    const logoPath = await uploadLogo(supabase, formData.get("logo") as File | null);
    if (logoPath) update.logo_path = logoPath;
    const { error } = await supabase.from("partners").update(update).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath("/admin/partner");
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deletePartner(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw new Error(`Partner löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/partner");
}
