"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { isLegalSlug } from "@/lib/legal";
import { revalidatePath } from "next/cache";
import { protokolliere } from "@/lib/audit";

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
  // Rechtstexte sind der Fall, für den Pflichtkern Punkt 12 geschrieben wurde:
  // Sie ändern sich selten, und wenn jemand fragt „seit wann steht das da so",
  // gibt es sonst keine Antwort. Der Text selbst gehört NICHT ins Protokoll —
  // er steht in `legal_pages`, hier reicht seine Länge als Anhaltspunkt.
  await protokolliere({
    aktion: "geaendert",
    objekt: "rechtstext",
    objektId: slug,
    bezeichnung: slug,
    details: { zeichen: String(formData.get("content") ?? "").length },
  });
  revalidatePublic();
  revalidatePath(`/admin/rechtliches/${slug}`);
}

export async function addOneLiner(formData: FormData) {
  const supabase = await createServerSupabase();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) throw new Error("Text ist Pflicht.");
  const { data, error } = await supabase.from("one_liners").insert({ text }).select("id").single();
  if (error) throw new Error(`Anlegen fehlgeschlagen: ${error.message}`);
  await protokolliere({ aktion: "angelegt", objekt: "oneliner", objektId: data.id as string, bezeichnung: text.slice(0, 80) });
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}

export async function toggleOneLiner(id: string, isActive: boolean) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("one_liners").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(`Ändern fehlgeschlagen: ${error.message}`);
  // Paarweise: Ein- und Ausschalten gehen durch dieselbe Funktion, also müssen
  // beide Richtungen unterscheidbar im Protokoll stehen.
  await protokolliere({
    aktion: isActive ? "veroeffentlicht" : "zurueckgezogen",
    objekt: "oneliner",
    objektId: id,
  });
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}

export async function deleteOneLiner(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("one_liners").delete().eq("id", id);
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`);
  await protokolliere({ aktion: "geloescht", objekt: "oneliner", objektId: id });
  revalidatePublic();
  revalidatePath("/admin/oneliner");
}
