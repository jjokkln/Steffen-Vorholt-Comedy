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

/**
 * Obergrenzen je Feld. Sie spiegeln den CHECK-Constraint aus Migration 0021 — die DB ist die
 * verbindliche Instanz (die REST-API ist an dieser Action vorbei erreichbar), hier stehen sie
 * nur, um dem Absender eine verständliche Meldung statt eines DB-Fehlers zu geben.
 */
const LIMITS = { name: 120, email: 254, phone: 40, message: 5000, payload: 200 } as const;

/**
 * Absichtlich grob: Eine Adresse serverseitig streng zu validieren ist unmöglich (RFC 5322 ist
 * praktisch nicht als Regex abbildbar), und jede zu strenge Prüfung sperrt echte Adressen aus.
 * Es geht nur darum, offensichtlichen Müll abzufangen, bevor eine Bestätigungsmail rausgeht —
 * und Zeilenumbrüche, die in einem Mail-Header nichts zu suchen haben (die Adresse landet in
 * `to`/`replyTo`).
 */
const EMAIL_MUSTER = /^[^\s@,;:<>"\\]+@[^\s@,;:<>"\\]+\.[^\s@,;:<>"\\]{2,}$/;

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
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !email) return { ok: false, error: "Name und E-Mail sind Pflicht – sonst können wir nicht zurückfunken." };

  if (!EMAIL_MUSTER.test(email) || email.length > LIMITS.email) {
    return { ok: false, error: "Diese E-Mail-Adresse sieht nicht gültig aus – bitte nochmal prüfen." };
  }
  if (name.length > LIMITS.name || phone.length > LIMITS.phone) {
    return { ok: false, error: "Name oder Telefonnummer sind zu lang." };
  }
  if (message.length > LIMITS.message) {
    return { ok: false, error: `Die Nachricht ist zu lang (maximal ${LIMITS.message} Zeichen).` };
  }

  const payload: Record<string, string> = {};
  for (const key of PAYLOAD_KEYS[type]) {
    payload[key] = String(formData.get(key) ?? "").trim().slice(0, LIMITS.payload);
  }

  const inquiry = { type, name, email, phone, message, payload };
  const { error } = await createPublicClient().from("inquiries").insert(inquiry);
  if (error) {
    // Migration 0021 bremst maschinelles Massen-Absenden auf DB-Ebene. Das ist kein Fehler,
    // sondern eine Absicht — und braucht eine andere Meldung als ein echter Ausfall.
    if (error.message.includes("ANFRAGE_LIMIT")) {
      return {
        ok: false,
        error:
          "Von hier kamen gerade sehr viele Anfragen. Bitte in einer Stunde erneut versuchen – " +
          "oder direkt eine E-Mail schreiben, die Adresse steht im Impressum.",
      };
    }
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
