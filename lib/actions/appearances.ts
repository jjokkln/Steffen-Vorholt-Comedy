"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

const KINDS = ["open_mic", "guest", "gig", "show"] as const;

function appearanceFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Titel ist Pflicht.");
  const kind = String(formData.get("kind") ?? "guest");
  const dateRaw = String(formData.get("date") ?? "").trim();
  return {
    title,
    organizer: String(formData.get("organizer") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    venue: String(formData.get("venue") ?? "").trim(),
    date: dateRaw || null,
    url: String(formData.get("url") ?? "").trim(),
    kind: (KINDS as readonly string[]).includes(kind) ? kind : "guest",
    color: String(formData.get("color") ?? "#7CFF6B"),
    flyer_path: String(formData.get("flyer_path") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_published: formData.get("is_published") === "on",
  };
}

export async function createAppearance(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase.from("appearances").insert(appearanceFields(formData));
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect("/admin/auftritte");
}

export async function updateAppearance(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase.from("appearances").update(appearanceFields(formData)).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath("/admin/auftritte");
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteAppearance(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("appearances").delete().eq("id", id);
  if (error) throw new Error(`Auftritt löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  revalidatePath("/admin/auftritte");
}
