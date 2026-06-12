"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

function eventFields(formData: FormData) {
  const show_id = String(formData.get("show_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const city = String(formData.get("city") ?? "").trim();
  if (!show_id || !date || !city) throw new Error("Show, Datum und Stadt sind Pflicht.");
  return {
    show_id,
    date,
    city,
    start_time: String(formData.get("start_time") ?? ""),
    entry_time: String(formData.get("entry_time") ?? ""),
    venue: String(formData.get("venue") ?? "").trim(),
    ticket_url: String(formData.get("ticket_url") ?? "").trim(),
    provider: String(formData.get("provider") ?? "").trim(),
    is_published: formData.get("is_published") === "on",
  };
}

export async function createEvent(formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").insert(eventFields(formData));
  if (error) throw new Error(`Termin anlegen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").update(eventFields(formData)).eq("id", id);
  if (error) throw new Error(`Termin speichern fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}

export async function deleteEvent(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Termin löschen fehlgeschlagen: ${error.message}`);
  revalidatePublic();
  redirect("/admin/termine");
}
