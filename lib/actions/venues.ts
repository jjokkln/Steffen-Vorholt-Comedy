"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { isInNrw, roundCoord } from "@/lib/venue-helpers";

export type FormState = { ok: boolean; message: string; at: number } | null;

const ADMIN_PATH = "/admin/standorte";

/**
 * Legt einen Spielort an. Koordinaten kommen aus dem Klick in die Karte
 * (components/shows/NRWMapClient.tsx) und stehen als hidden inputs im Formular.
 */
export async function createVenue(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerSupabase();
  // Server Actions prüfen selbst, Middleware allein reicht nicht.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Nicht angemeldet.", at: Date.now() };

  const city = String(formData.get("city") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const showId = String(formData.get("show_id") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!city) return { ok: false, message: "Bitte einen Ort eintragen.", at: Date.now() };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: "Bitte erst in die Karte klicken.", at: Date.now() };
  }
  if (!isInNrw(lat, lng)) {
    return { ok: false, message: "Der Punkt liegt außerhalb von NRW.", at: Date.now() };
  }

  const { error } = await supabase.from("venues").insert({
    city,
    venue: venue || "Location folgt",
    lat: roundCoord(lat),
    lng: roundCoord(lng),
    show_id: showId || null,
  });
  if (error) {
    return { ok: false, message: `Standort anlegen fehlgeschlagen: ${error.message}`, at: Date.now() };
  }

  revalidatePublic();
  revalidatePath(ADMIN_PATH);
  return { ok: true, message: `${city} gespeichert – Karte aktualisiert.`, at: Date.now() };
}

/**
 * Löscht einen Spielort. Orte mit Terminen bleiben stehen: sonst verlieren die
 * Termine still ihre Position auf der Karte (die FK steht auf `set null`).
 */
export async function deleteVenue(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Standort löschen fehlgeschlagen: nicht angemeldet.");

  const { count, error: countError } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", id);
  if (countError) throw new Error(`Standort löschen fehlgeschlagen: ${countError.message}`);
  if (count && count > 0) {
    throw new Error(
      `Standort löschen fehlgeschlagen: An diesem Ort hängen noch ${count} Termin(e). Erst die Termine umziehen oder löschen.`,
    );
  }

  const { error } = await supabase.from("venues").delete().eq("id", id);
  if (error) throw new Error(`Standort löschen fehlgeschlagen: ${error.message}`);

  revalidatePublic();
  revalidatePath(ADMIN_PATH);
}
