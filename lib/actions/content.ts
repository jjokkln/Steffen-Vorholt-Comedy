"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { isLegalSlug } from "@/lib/legal";
import { revalidatePath } from "next/cache";

export async function saveLegalPage(slug: string, formData: FormData) {
  // Der Slug kommt über bind() aus der Route — nur die bekannten Rechtsseiten zulassen,
  // damit hier keine beliebigen Zeilen in legal_pages entstehen.
  if (!isLegalSlug(slug)) throw new Error(`Unbekannte Rechtsseite: ${slug}`);

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("legal_pages").upsert({
    slug,
    content: String(formData.get("content") ?? ""),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath(`/admin/rechtliches/${slug}`);
}

export async function addOneLiner(formData: FormData) {
  const supabase = await createServerSupabase();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Text ist Pflicht.");
  const { error } = await supabase.from("one_liners").insert({ text });
  if (error) throw new Error(`Anlegen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}

export async function toggleOneLiner(id: string, isActive: boolean) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("one_liners").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(`Ändern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}

export async function deleteOneLiner(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("one_liners").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}
