"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";
import { parseDateList } from "@/lib/bulk-dates";
import { protokolliere } from "@/lib/audit";

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
  let neueId: string;
  try {
    const felder = eventFields(formData);
    const { data, error } = await supabase.from("events").insert(felder).select("id").single();
    if (error) throw new Error(error.message);
    neueId = data.id as string;
  } catch (err) {
    return { ok: false, message: `Termin anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  await protokolliere({
    aktion: "angelegt",
    objekt: "termin",
    objektId: neueId,
    bezeichnung: `${String(formData.get("date") ?? "")} ${String(formData.get("city") ?? "")}`.trim(),
    details: { veroeffentlicht: formData.get("is_published") === "on" },
  });
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
  // `is_published` steht dabei: Ein Termin, der still offline genommen wird,
  // ist für einen Besucher dasselbe wie ein abgesagter — nur ohne Absage.
  await protokolliere({
    aktion: "geaendert",
    objekt: "termin",
    objektId: id,
    bezeichnung: `${String(formData.get("date") ?? "")} ${String(formData.get("city") ?? "")}`.trim(),
    details: { veroeffentlicht: formData.get("is_published") === "on" },
  });
  revalidatePublic();
  revalidatePath(`/admin/termine/${id}`);
  return { ok: true, message: "Gespeichert!", at: Date.now() };
}

export async function deleteEvent(id: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Termin löschen fehlgeschlagen: ${error.message}`);
  await protokolliere({ aktion: "geloescht", objekt: "termin", objektId: id });
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
  let neueId: string;
  try {
    const { data, error } = await supabase.from("events").insert(eventFields(formData)).select("id").single();
    if (error) throw new Error(error.message);
    neueId = data.id as string;
  } catch (err) {
    return { ok: false, message: `Termin anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  // Zweiter Weg in dieselbe Sache — und deshalb protokollpflichtig wie der
  // erste: Ein Termin, der über die Show-Seite entsteht, ist derselbe Vorgang
  // wie einer aus der Terminliste (Pflichtkern Punkt 12, „jeder zweite Weg").
  await protokolliere({
    aktion: "angelegt",
    objekt: "termin",
    objektId: neueId,
    bezeichnung: `${String(formData.get("date") ?? "")} ${String(formData.get("city") ?? "")}`.trim(),
    details: { ueber: "show-seite", veroeffentlicht: formData.get("is_published") === "on" },
  });
  revalidatePublic();
  redirect(`/admin/shows/${showId}`);
}

/**
 * Legt mehrere Termine auf einmal an einem Spielort an (/admin/standorte).
 * Stadt und Location kommen aus dem Standort selbst — dieselbe Location zweimal
 * abzutippen war der eigentliche Zeitfresser, wenn eine Show dort monatlich läuft.
 *
 * Uhrzeiten, Ticketlink und Status gelten für alle Termine der Serie; einzelne
 * Abweichungen bearbeitet man danach im Termin selbst.
 */
export async function createVenueEvents(
  venueId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerSupabase();
  // Server Actions prüfen selbst, Middleware allein reicht nicht.
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, message: "Nicht angemeldet.", at: Date.now() };

  const show_id = String(formData.get("show_id") ?? "").trim();
  const dates = parseDateList(String(formData.get("dates") ?? ""));
  if (!show_id) return { ok: false, message: "Bitte eine Show wählen.", at: Date.now() };
  if (dates.length === 0) return { ok: false, message: "Bitte mindestens ein Datum hinzufügen.", at: Date.now() };

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("city, venue")
    .eq("id", venueId)
    .single();
  if (venueError || !venue) {
    return { ok: false, message: "Standort nicht gefunden.", at: Date.now() };
  }

  // Dubletten still überspringen statt am Unique-Constraint zu scheitern (es
  // gibt keinen) – sonst legt ein zweiter Klick auf „anlegen" alles doppelt an.
  const { data: existingRows, error: existingError } = await supabase
    .from("events")
    .select("date")
    .eq("venue_id", venueId)
    .eq("show_id", show_id)
    .in("date", dates);
  if (existingError) {
    return { ok: false, message: `Termine anlegen fehlgeschlagen: ${existingError.message}`, at: Date.now() };
  }
  const existing = new Set((existingRows ?? []).map((r) => r.date as string));
  const fresh = dates.filter((d) => !existing.has(d));

  if (fresh.length === 0) {
    return {
      ok: false,
      message: `${dates.length === 1 ? "Der Termin ist" : "Alle Termine sind"} an diesem Ort schon angelegt.`,
      at: Date.now(),
    };
  }

  const shared = {
    show_id,
    venue_id: venueId,
    city: venue.city as string,
    venue: venue.venue as string,
    start_time: String(formData.get("start_time") ?? ""),
    entry_time: String(formData.get("entry_time") ?? ""),
    ticket_url: String(formData.get("ticket_url") ?? "").trim(),
    provider: String(formData.get("provider") ?? "").trim(),
    is_published: formData.get("is_published") === "on",
  };

  const { error } = await supabase.from("events").insert(fresh.map((date) => ({ ...shared, date })));
  if (error) {
    return { ok: false, message: `Termine anlegen fehlgeschlagen: ${error.message}`, at: Date.now() };
  }

  // Eine Serie ist EIN Vorgang, nicht n. Protokolliert wird deshalb der Ort mit
  // der Zahl der entstandenen Termine — n Einzelzeilen wären Rauschen, in dem
  // die Vorgänge untergehen, auf die es ankommt.
  await protokolliere({
    aktion: "angelegt",
    objekt: "termin",
    objektId: venueId,
    bezeichnung: `${fresh.length} Termine in ${venue.city as string}`,
    details: { anzahl: fresh.length, uebersprungen: dates.length - fresh.length, ueber: "standort-serie" },
  });
  revalidatePublic();
  revalidatePath("/admin/standorte");
  revalidatePath("/admin/termine");
  const skipped = dates.length - fresh.length;
  return {
    ok: true,
    message:
      `${fresh.length} ${fresh.length === 1 ? "Termin" : "Termine"} in ${venue.city} angelegt` +
      (skipped ? ` (${skipped} ${skipped === 1 ? "war" : "waren"} schon da).` : "."),
    at: Date.now(),
  };
}

export async function deleteShowEvent(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Termin löschen fehlgeschlagen: ${error.message}`);
  await protokolliere({ aktion: "geloescht", objekt: "termin", objektId: id, details: { ueber: "show-seite" } });
  revalidatePublic();
  redirect(`/admin/shows/${showId}`);
}
