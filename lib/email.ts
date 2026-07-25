import nodemailer from "nodemailer";
import { renderInquiryConfirmation } from "@/lib/email-templates";
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

function transporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/** Versand best-effort: Fehler werden geloggt, niemals geworfen. */
export async function sendInquiryNotification(inquiry: Pick<Inquiry, "type" | "name" | "email" | "phone" | "message" | "payload">) {
  const to = recipientFor(inquiry.type);
  const mailer = transporter();
  if (!mailer || !to) {
    console.warn("[email] SMTP-Zugangsdaten/Empfänger fehlen – Benachrichtigung übersprungen.");
    return;
  }
  const label = INQUIRY_LABELS[inquiry.type] ?? inquiry.type;
  const extras = Object.entries(inquiry.payload)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  try {
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      replyTo: inquiry.email,
      subject: `🛸 Neue Anfrage (${label}) von ${inquiry.name}`,
      text: `Typ: ${label}\nName: ${inquiry.name}\nE-Mail: ${inquiry.email}\nTelefon: ${inquiry.phone || "—"}\n${extras}\n\nNachricht:\n${inquiry.message}\n\n→ Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de"}/admin/anfragen`,
    });
  } catch (e) {
    console.error("[email] Versand fehlgeschlagen:", e);
  }
}

/** Kurze Text-Alternative zur HTML-Bestätigung (Nodemailer verschickt beides gemeinsam). */
function confirmationText(inquiry: Pick<Inquiry, "type" | "name" | "payload">): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";
  switch (inquiry.type) {
    case "booking_show":
      return `Hi ${inquiry.name},\n\ndeine Show-Anfrage ist angekommen (Show: ${inquiry.payload.show || "—"}, Wunschdatum: ${inquiry.payload.event_date || "nach Absprache"}, Stadt: ${inquiry.payload.city || "—"}). Steffen meldet sich so bald wie möglich bei dir.\n\n${site}`;
    case "booking_steffen":
      return `Guten Tag ${inquiry.name},\n\nIhre Booking-Anfrage wurde erfolgreich übermittelt (Eventart: ${inquiry.payload.event_type || "—"}, Datum: ${inquiry.payload.event_date || "nach Absprache"}). Sie erhalten zeitnah eine persönliche Rückmeldung von Steffen.\n\n${site}`;
    case "frage_feedback":
      return `Hi ${inquiry.name},\n\ndanke für deine Nachricht. Steffen liest mit und meldet sich, sobald eine Antwort erforderlich ist.\n\n${site}`;
  }
}

/** Bestätigungsmail an den Absender selbst (Gegenstück zu sendInquiryNotification, die an Steffen geht). */
export async function sendInquiryConfirmation(inquiry: Pick<Inquiry, "type" | "name" | "email" | "message" | "payload">) {
  const mailer = transporter();
  if (!mailer) {
    console.warn("[email] SMTP-Zugangsdaten fehlen – Bestätigungsmail übersprungen.");
    return;
  }
  try {
    const { subject, html } = renderInquiryConfirmation(inquiry);
    await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: inquiry.email,
      subject,
      html,
      text: confirmationText(inquiry),
    });
  } catch (e) {
    console.error("[email] Bestätigungsmail fehlgeschlagen:", e);
  }
}
