import { createPublicClient } from "@/lib/supabase/public";
import type { InquiryType } from "@/lib/types";

/** Settings-Keys in `site_settings`. Prefix `notify_email_` ist per RLS anon-lesbar (Formular-Submit). */
export const NOTIFY_KEYS = {
  shows: "notify_email_shows",
  booking: "notify_email_booking",
  all: "notify_email_all",
} as const;

export interface NotificationSettings {
  /** Booking Show + Frage/Feedback */
  shows: string;
  /** Booking Steffen */
  booking: string;
  /** Zusätzlicher Empfänger für ALLE Anfragen (optional) */
  all: string;
}

/**
 * Fallback, wenn die DB-Einstellung leer ist oder nicht gelesen werden kann:
 * erst Env, dann die historisch im Code hinterlegten Adressen. So kann der Versand
 * nie komplett ausfallen, nur weil ein Feld im Dashboard leer geräumt wurde.
 */
function fallback(): NotificationSettings {
  return {
    shows: process.env.EMAIL_SHOWS || "Steffen.vorholt.comedyshows@gmail.com",
    booking: process.env.EMAIL_BOOKING || "Steffen.vorholt.comedybooking@gmail.com",
    all: "",
  };
}

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;.]+\.[a-z]{2,}$/i;

/** Zerlegt ein Eingabefeld („a@b.de, c@d.de") in einzelne Adressen. Trennt an Komma, Semikolon, Zeilenumbruch. */
export function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isValidEmail(address: string): boolean {
  return EMAIL_RE.test(address);
}

/** Adressen aus einer Feldeingabe normalisieren: gültige behalten, Duplikate (case-insensitive) entfernen. */
export function normalizeRecipients(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const address of parseRecipients(raw)) {
    if (!isValidEmail(address)) continue;
    const key = address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(address);
  }
  return out;
}

/**
 * Empfänger-Adressen für die Admin-Benachrichtigung aus `site_settings` laden.
 * Läuft über den anon-Client, damit auch der öffentliche Formular-Submit (ohne Session) sie lesen kann.
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const defaults = fallback();
  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("key,value")
      .in("key", Object.values(NOTIFY_KEYS));
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { key: string; value: string }[];
    const value = (key: string) => rows.find((r) => r.key === key)?.value?.trim() ?? "";
    return {
      shows: value(NOTIFY_KEYS.shows) || defaults.shows,
      booking: value(NOTIFY_KEYS.booking) || defaults.booking,
      all: value(NOTIFY_KEYS.all),
    };
  } catch (e) {
    console.error("[settings] Benachrichtigungs-Empfänger nicht ladbar – Fallback greift:", e);
    return defaults;
  }
}

/** Endgültige Empfängerliste für einen Anfrage-Typ: Typ-Adresse(n) + „alle Anfragen"-Adresse(n), dedupliziert. */
export function recipientsFor(type: InquiryType, settings: NotificationSettings): string[] {
  const primary = type === "booking_steffen" ? settings.booking : settings.shows;
  return normalizeRecipients([primary, settings.all].filter(Boolean).join(","));
}
