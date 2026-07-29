"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

function eventFields(formData: FormData) {
  const show_id = String(formData.get("show_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  if (!show_id || !date || !city) throw new Error("Show, Datum und Stadt sind Pflicht.");
  // Leerer Select = kein Punkt auf der NRW-Karte. "" würde die uuid-Spalte
  // sprengen, deshalb explizit null.
  const venue_id = String(formData.get("venue_id") ?? "").trim() || null;
  return {
    show_id,
    date,
    city,
    venue_id,
    start_time: String(formData.get("start_time") ?? ""),
    entry_time: String(formData.get("entry_time") ?? ""),
    venue: String(formData.get("venue") ?? "").trim(),
    ticket_url: String(formData.get("ticket_url") ?? "").trim(),
    provider: String(formData.get("provider") ?? "").trim(),
    is_published: formData.get("is_published") === "on",
  };
}

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase.from("events").insert(eventFields(formData));
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Termin anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect("/admin/termine");
}

export async function updateEvent(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase.from("events").update(eventFields(formData)).eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Termin speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  revalidatePath(`/admin/termine/${id}`);
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteEvent(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Termin löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}

// Show-scoped Varianten: Termine direkt aus den Show-Einstellungen anlegen/löschen
// und dorthin zurückspringen (statt in die globale Termin-Übersicht).
export async function createShowEvent(
  showId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerSupabase();
  try {
    const { error } = await supabase.from("events").insert(eventFields(formData));
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Termin anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidatePublic();
  redirect(`/admin/shows/${showId}`);
}

export async function deleteShowEvent(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Termin löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect(`/admin/shows/${showId}`);
}
