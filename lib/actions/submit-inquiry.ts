"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { sendInquiryConfirmation, sendInquiryNotification } from "@/lib/email";
import { getNotificationSettings } from "@/lib/settings";
import type { InquiryType } from "@/lib/types";

export interface InquiryFormState {
  ok: boolean;
  error?: string;
}

const PAYLOAD_KEYS: Record<InquiryType, string[]> = {
  booking_show: ["show", "event_date", "city", "video_requested"],
  booking_steffen: ["company", "event_type", "event_date"],
  frage_feedback: [],
};

export async function submitInquiry(
  type: InquiryType,
  _prev: InquiryFormState | null,
  formData: FormData,
): Promise<InquiryFormState> {
  // Honeypot: echtes Feld ist unsichtbar — Bots füllen es aus.
  if (String(formData.get("website") ?? "")) return { ok: true };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !email) return { ok: false, error: "Name und E-Mail sind Pflicht – sonst können wir nicht zurückfunken." };

  const payload: Record<string, string> = {};
  for (const key of PAYLOAD_KEYS[type]) payload[key] = String(formData.get(key) ?? "").trim();

  const inquiry = { type, name, email, phone: String(formData.get("phone") ?? "").trim(), message, payload };
  const { error } = await createPublicClient().from("inquiries").insert(inquiry);
  if (error) {
    console.error("[inquiry] Insert fehlgeschlagen:", error);
    return { ok: false, error: "Houston, wir haben ein Problem. Bitte später nochmal versuchen." };
  }
  // Empfänger-Einstellungen einmal laden und an beide Mails geben (statt zweimal die DB fragen).
  const settings = await getNotificationSettings();
  await Promise.all([
    sendInquiryNotification(inquiry, settings),
    sendInquiryConfirmation(inquiry, settings),
  ]);
  return { ok: true };
}
