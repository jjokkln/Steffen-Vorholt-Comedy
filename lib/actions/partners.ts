"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { deleteFilesIfUnused } from "@/lib/media-refs";
import { protokolliere } from "@/lib/audit";

export type FormState = { ok: boolean; message: string; at: number } | null;

function partnerFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name ist Pflicht.");
  return {
    name,
    url: String(formData.get("url") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    logo_path: String(formData.get("logo_path") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createPartner(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  let neueId: string;
  try {
    const fields = partnerFields(formData);
    const { data, error } = await supabase.from("partners").insert(fields).select("id").single();
    if (error) throw new Error(error.message);
    neueId = data.id as string;
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  await protokolliere({
    aktion: "angelegt",
    objekt: "partner",
    objektId: neueId,
    bezeichnung: String(formData.get("name") ?? ""),
  });
  revalidatePublic();
  redirect("/admin/partner");
}

export async function updatePartner(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  // Ersetztes Bild hinterher wegräumen — `deleteFilesIfUnused` prüft vorher, ob noch
  // jemand darauf zeigt, ein unverändertes Bild bleibt damit unangetastet.
  const { data: previous } = await supabase
    .from("partners").select("logo_path").eq("id", id).maybeSingle();
  try {
    const fields = partnerFields(formData);
    const { error } = await supabase.from("partners").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  await deleteFilesIfUnused(supabase, [previous?.logo_path]);
  await protokolliere({
    aktion: "geaendert",
    objekt: "partner",
    objektId: id,
    bezeichnung: String(formData.get("name") ?? ""),
    details: { sichtbar: formData.get("is_active") === "on" },
  });
  revalidatePublic();
  revalidatePath("/admin/partner");
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deletePartner(id: string) {
  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from("partners").select("logo_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) throw new Error(`Partner löschen fehlgeschlagen: ${error.message}`);
  await deleteFilesIfUnused(supabase, [row?.logo_path]);
  await protokolliere({ aktion: "geloescht", objekt: "partner", objektId: id });
  revalidatePublic();
  revalidatePath("/admin/partner");
}
