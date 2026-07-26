"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendNotificationTestMail } from "@/lib/email";
import {
  NOTIFY_KEYS,
  getNotificationSettings,
  isValidEmail,
  normalizeRecipients,
  parseRecipients,
  recipientsFor,
} from "@/lib/settings";

export type FormState = { ok: boolean; message: string; at: number } | null;

/** Mail-Versand ist kein RLS-geschützter DB-Zugriff — Session hier zusätzlich selbst prüfen. */
async function requireAdmin() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");
  return supabase;
}

/** Prüft ein Eingabefeld mit ggf. mehreren Adressen und gibt die bereinigte Liste zurück. */
function validateField(raw: string, label: string, required: boolean): string {
  const entries = parseRecipients(raw);
  if (!entries.length) {
    if (required) throw new Error(`${label}: mindestens eine E-Mail-Adresse ist nötig.`);
    return "";
  }
  const invalid = entries.filter((e) => !isValidEmail(e));
  if (invalid.length) throw new Error(`${label}: „${invalid.join("“, „")}" ist keine gültige E-Mail-Adresse.`);
  return normalizeRecipients(raw).join(", ");
}

export async function saveNotificationSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const supabase = await requireAdmin();
    const rows = [
      { key: NOTIFY_KEYS.shows, value: validateField(String(formData.get("shows") ?? ""), "Show-Anfragen & Fragen", true) },
      { key: NOTIFY_KEYS.booking, value: validateField(String(formData.get("booking") ?? ""), "Booking-Anfragen", true) },
      { key: NOTIFY_KEYS.all, value: validateField(String(formData.get("all") ?? ""), "Zusätzlicher Empfänger", false) },
    ].map((r) => ({ ...r, updated_at: new Date().toISOString() }));

    const { error } = await supabase.from("site_settings").upsert(rows);
    if (error) throw new Error(error.message);
  } catch (err) {
    return { ok: false, message: (err as Error).message, at: Date.now() };
  }
  revalidatePath("/admin/einstellungen");
  return { ok: true, message: "Empfänger gespeichert.", at: Date.now() };
}

/** Schickt eine Testmail an alle hinterlegten Empfänger, damit Steffen die Zustellung prüfen kann. */
export async function sendTestNotification(_prev: FormState, _formData: FormData): Promise<FormState> {
  try {
    await requireAdmin();
    const settings = await getNotificationSettings();
    const to = normalizeRecipients(
      [...recipientsFor("booking_show", settings), ...recipientsFor("booking_steffen", settings)].join(","),
    );
    const result = await sendNotificationTestMail(to);
    return { ok: result.ok, message: result.message, at: Date.now() };
  } catch (err) {
    return { ok: false, message: (err as Error).message, at: Date.now() };
  }
}
