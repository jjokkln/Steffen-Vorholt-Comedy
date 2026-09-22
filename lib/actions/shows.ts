"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { deleteFilesIfUnused } from "@/lib/media-refs";
import { protokolliere } from "@/lib/audit";

export type FormState = { ok: boolean; message: string; at: number } | null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrinciples(raw: string): { title: string; text: string }[] {
  // Eine Zeile pro Punkt, Format: "Titel :: Text"
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split("::");
      return { title: title.trim(), text: rest.join("::").trim() };
    });
}

function showFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name ist Pflicht.");
  return {
    name,
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    format_label: String(formData.get("format_label") ?? "").trim(),
    hint_text: String(formData.get("hint_text") ?? "").trim(),
    color: String(formData.get("color") ?? "#7CFF6B"),
    principle_items: parsePrinciples(String(formData.get("principles") ?? "")),
    cities_text: String(formData.get("cities_text") ?? "").trim(),
    planet_image_path: String(formData.get("planet_image_path") ?? "").trim(),
    header_image_path: String(formData.get("header_image_path") ?? "").trim(),
    background_image_path: String(formData.get("background_image_path") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createShow(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  let newId: string;
  try {
    const fields = showFields(formData);
    const slug = slugify(fields.name);
    const { data, error } = await supabase.from("shows").insert({ ...fields, slug }).select("id").single();
    if (error) throw new Error(error.message);
    newId = data.id as string;
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  await protokolliere({
    aktion: "angelegt",
    objekt: "show",
    objektId: newId,
    bezeichnung: String(formData.get("name") ?? ""),
  });
  revalidatePublic();
  // Auf die Bearbeiten-Seite der neuen Show, damit direkt Videos hinzugefügt werden können.
  redirect(`/admin/shows/${newId}`);
}

export async function updateShow(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  // Alte Pfade vor dem Schreiben merken. Danach dürfen ALLE drei in die Aufräumrunde:
  // `deleteFilesIfUnused` zählt vorher die Verweise, ein unverändert gebliebenes Bild
  // wird also gefunden und bleibt liegen.
  const { data: previous } = await supabase
    .from("shows")
    .select("planet_image_path, header_image_path, background_image_path")
    .eq("id", id)
    .maybeSingle();
  try {
    const fields = showFields(formData);
    const { error } = await supabase.from("shows").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  await deleteFilesIfUnused(supabase, [
    previous?.planet_image_path,
    previous?.header_image_path,
    previous?.background_image_path,
  ]);
  // `is_active` steht im Protokoll, weil es die Sichtbarkeit auf der Website
  // entscheidet — „war die Show am Stichtag online" ist genau die Frage, die
  // rückwirkend gestellt wird.
  await protokolliere({
    aktion: "geaendert",
    objekt: "show",
    objektId: id,
    bezeichnung: String(formData.get("name") ?? ""),
    details: { sichtbar: formData.get("is_active") === "on" },
  });
  revalidatePublic();
  revalidatePath(`/admin/shows/${id}`);
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteShow(id: string) {
  const supabase = await createServerSupabase();
  // Eine Show zieht per ON DELETE CASCADE ihre Bilder und Videos mit. Deren Dateien
  // kennt hinterher niemand mehr — also jetzt einsammeln.
  const [{ data: show }, { data: images }, { data: videos }] = await Promise.all([
    supabase.from("shows")
      .select("planet_image_path, header_image_path, background_image_path").eq("id", id).maybeSingle(),
    supabase.from("show_images").select("image_path").eq("show_id", id),
    supabase.from("show_videos").select("video_path, poster_path").eq("show_id", id),
  ]);
  const { error } = await supabase.from("shows").delete().eq("id", id);
  if (error) throw new Error(`Show löschen fehlgeschlagen: ${error.message}`);
  await deleteFilesIfUnused(supabase, [
    show?.planet_image_path,
    show?.header_image_path,
    show?.background_image_path,
    ...(images ?? []).map((row) => row.image_path as string),
    ...(videos ?? []).flatMap((row) => [row.video_path as string, row.poster_path as string]),
  ]);
  await protokolliere({
    aktion: "geloescht",
    objekt: "show",
    objektId: id,
    bezeichnung: null,
    // Beim Löschen einer Show fallen Bilder und Videos per CASCADE mit weg.
    // Die Zahlen stehen hier, weil sie hinterher nicht mehr zu ermitteln sind.
    details: { bilder: (images ?? []).length, videos: (videos ?? []).length },
  });
  revalidatePublic();
  redirect("/admin/shows");
}
