"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

export type FormState = { ok: boolean; message: string; at: number } | null;

function offerFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Name ist Pflicht.");
  return {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    code: String(formData.get("code") ?? "").trim(),
    validity: String(formData.get("validity") ?? "").trim(),
    url: String(formData.get("url") ?? "").trim(),
    image_path: String(formData.get("image_path") ?? "").trim(),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

/**
 * Show-Zuordnung aus dem Formular. Leer = „keiner Show zugeordnet" (dann nirgends sichtbar);
 * fehlt das Feld ganz, bleibt die Zuordnung der aufgerufenen Seite.
 */
function formShowId(formData: FormData, fallback: string): string | null {
  if (!formData.has("show_id")) return fallback;
  const value = String(formData.get("show_id") ?? "").trim();
  return value || null;
}

/** Betroffene Admin-Seiten neu bauen — beim Verschieben sind das zwei Shows. */
function revalidateShows(...showIds: (string | null)[]) {
  revalidatePublic();
  for (const id of new Set(showIds.filter(Boolean) as string[])) {
    revalidatePath(`/admin/shows/${id}`);
  }
}

/** Angebote hängen an einer Show und werden unter /admin/shows/<id> gepflegt. */
export async function createShowOffer(
  showId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerSupabase();
  let target: string | null = showId;
  try {
    target = formShowId(formData, showId);
    const { error } = await supabase.from("offers").insert({ ...offerFields(formData), show_id: target });
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Anlegen fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidateShows(showId, target);
  return { ok: true, message: "Angebot angelegt!", at: Date.now() };
}

export async function updateOffer(
  id: string,
  showId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createServerSupabase();
  let target: string | null = showId;
  try {
    target = formShowId(formData, showId);
    const { error } = await supabase
      .from("offers")
      .update({ ...offerFields(formData), show_id: target })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: `Speichern fehlgeschlagen: ${(err as Error).message}`, at: Date.now() };
  }
  revalidateShows(showId, target);
  return { ok: true, message: target === showId ? "Gespeichert!" : "Gespeichert und verschoben!", at: Date.now() };
}

/**
 * Bestehendes Angebot einer Show zuschlagen — für Altbestand aus der früheren
 * /angebote-Seite und zum Umhängen zwischen Shows. `targetShowId: null` löst die Zuordnung.
 */
export async function assignOfferToShow(
  id: string,
  currentShowId: string,
  targetShowId: string | null,
) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("offers").update({ show_id: targetShowId }).eq("id", id);
  if (error) throw new Error(`Zuordnen fehlgeschlagen: ${error.message}`);
  revalidateShows(currentShowId, targetShowId);
}

/** Ein-Klick-Schalter für „erscheint auf der Show-Seite". */
export async function setOfferActive(id: string, showId: string, isActive: boolean) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("offers").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(`Sichtbarkeit ändern fehlgeschlagen: ${error.message}`);
  revalidateShows(showId);
}

export async function deleteOffer(id: string, showId: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("offers").delete().eq("id", id);
  if (error) throw new Error(`Angebot löschen fehlgeschlagen: ${error.message}`);
  revalidateShows(showId);
}
