"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

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

async function uploadPlanet(supabase: Awaited<ReturnType<typeof createServerSupabase>>, slug: string, file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("planets").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Planet-Upload fehlgeschlagen: ${error.message}`);
  return `planets/${path}`;
}

async function uploadBackground(supabase: Awaited<ReturnType<typeof createServerSupabase>>, slug: string, file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `bg-${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Hintergrund-Upload fehlgeschlagen: ${error.message}`);
  return `media/${path}`;
}

async function uploadHeader(supabase: Awaited<ReturnType<typeof createServerSupabase>>, slug: string, file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop() || "webp";
  const path = `header-${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Titelbild-Upload fehlgeschlagen: ${error.message}`);
  return `media/${path}`;
}

function showFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name ist Pflicht.");
  return {
    name,
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    format_label: String(formData.get("format_label") ?? "").trim(),
    color: String(formData.get("color") ?? "#7CFF6B"),
    principle_items: parsePrinciples(String(formData.get("principles") ?? "")),
    cities_text: String(formData.get("cities_text") ?? "").trim(),
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
    const planetPath = await uploadPlanet(supabase, slug, formData.get("planet") as File | null);
    const backgroundPath = await uploadBackground(supabase, slug, formData.get("background") as File | null);
    const headerPath = await uploadHeader(supabase, slug, formData.get("header_image") as File | null);
    const { data, error } = await supabase.from("shows").insert({
      ...fields,
      slug,
      planet_image_path: planetPath ?? "",
      background_image_path: backgroundPath ?? "",
      header_image_path: headerPath ?? "",
    }).select("id").single();
    if (error) throw new Error(error.message);
    newId = data.id as string;
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  // Auf die Bearbeiten-Seite der neuen Show, damit direkt Videos hinzugefügt werden können.
  redirect(`/admin/shows/${newId}`);
}

export async function updateShow(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const fields = showFields(formData);
    const update: Record<string, unknown> = { ...fields };
    const { data: existing } = await supabase.from("shows").select("slug").eq("id", id).single();
    const planetPath = await uploadPlanet(supabase, existing?.slug ?? "show", formData.get("planet") as File | null);
    if (planetPath) update.planet_image_path = planetPath;
    const backgroundPath = await uploadBackground(supabase, existing?.slug ?? "show", formData.get("background") as File | null);
    if (backgroundPath) update.background_image_path = backgroundPath;
    const headerPath = await uploadHeader(supabase, existing?.slug ?? "show", formData.get("header_image") as File | null);
    if (headerPath) update.header_image_path = headerPath;
    const { error } = await supabase.from("shows").update(update).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath(`/admin/shows/${id}`);
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteShow(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("shows").delete().eq("id", id);
  if (error) throw new Error(`Show löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/shows");
}
