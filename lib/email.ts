import { Resend } from "resend";
import { INQUIRY_LABELS, type Inquiry } from "@/lib/types";

// Zwei Empfänger-Adressen je nach Formular (per Env überschreibbar):
// - Booking Steffen          → comedybooking@gmail.com
// - Booking Show / Frage      → comedyshows@gmail.com
const EMAIL_SHOWS = process.env.EMAIL_SHOWS ?? "Steffen.vorholt.comedyshows@gmail.com";
const EMAIL_BOOKING = process.env.EMAIL_BOOKING ?? "Steffen.vorholt.comedybooking@gmail.com";

function recipientFor(type: Inquiry["type"]): string {
  const target = type === "booking_steffen" ? EMAIL_BOOKING : EMAIL_SHOWS;
  // Per-Typ-Adresse hat Vorrang; NOTIFICATION_EMAIL nur als Fallback, falls leer.
  return target || (process.env.NOTIFICATION_EMAIL ?? "");
}

/** Versand best-effort: Fehler werden geloggt, niemals geworfen. */
export async function sendInquiryNotification(inquiry: Pick<Inquiry, "type" | "name" | "email" | "phone" | "message" | "payload">) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = recipientFor(inquiry.type);
  if (!apiKey || !to) {
    console.warn("[email] RESEND_API_KEY/Empfänger fehlt – Benachrichtigung übersprungen.");
    return;
  }
  const label = INQUIRY_LABELS[inquiry.type] ?? inquiry.type;
  const extras = Object.entries(inquiry.payload)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  try {
    await new Resend(apiKey).emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      replyTo: inquiry.email,
      subject: `🛸 Neue Anfrage (${label}) von ${inquiry.name}`,
      text: `Typ: ${label}\nName: ${inquiry.name}\nE-Mail: ${inquiry.email}\nTelefon: ${inquiry.phone || "—"}\n${extras}\n\nNachricht:\n${inquiry.message}\n\n→ Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de"}/admin/anfragen`,
    });
  } catch (e) {
    console.error("[email] Versand fehlgeschlagen:", e);
  }
}
