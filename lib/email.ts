import nodemailer from "nodemailer";
import { renderInquiryConfirmation } from "@/lib/email-templates";
import {
  getNotificationSettings,
  recipientsFor,
  type NotificationSettings,
} from "@/lib/settings";
import { inquiryNotificationSubject, inquiryNotificationText } from "@/lib/notification-text";
import { INQUIRY_FIELD_LABELS, INQUIRY_LABELS, type Inquiry } from "@/lib/types";

/**
 * Kanonische Site-URL für Mail-Links. Die Apex-Domain leitet per 308 auf www um —
 * Redirect-Ketten in Mails kosten Deliverability (und brechen Bilder in manchen Clients).
 */
export const MAIL_SITE_URL = (() => {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.steffenvorholt.de").replace(/\/+$/, "");
  return raw.replace(/^(https?:\/\/)steffenvorholt\.de/i, "$1www.steffenvorholt.de");
})();

/** Absender mit Anzeigename: „Steffen Vorholt Comedy <…>" wirkt weniger nach Bot als eine nackte Adresse. */
function sender(): { name: string; address: string } | undefined {
  const address = process.env.EMAIL_FROM ?? "";
  if (!address) return undefined;
  return { name: process.env.EMAIL_FROM_NAME || "Steffen Vorholt Comedy", address };
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

type NotificationInput = Pick<Inquiry, "type" | "name" | "email" | "phone" | "message" | "payload">;

/**
 * Plaintext-Benachrichtigung an Steffen — pro Anfrage, mit allen erfassten Feldern.
 * Empfänger kommen aus den Dashboard-Einstellungen (`site_settings`), nicht mehr aus dem Code.
 * Versand best-effort: Fehler werden geloggt, niemals geworfen (die Anfrage ist längst gespeichert).
 */
export async function sendInquiryNotification(inquiry: NotificationInput, settings?: NotificationSettings) {
  const resolved = settings ?? (await getNotificationSettings());
  const to = recipientsFor(inquiry.type, resolved);
  const mailer = transporter();
  if (!mailer || !to.length) {
    console.warn("[email] SMTP-Zugangsdaten/Empfänger fehlen – Benachrichtigung übersprungen.");
    return;
  }
  const typeLabel = INQUIRY_LABELS[inquiry.type] ?? inquiry.type;
  try {
    await mailer.sendMail({
      from: sender(),
      to,
      // Antwort geht direkt an den Anfragenden – Steffen kann aus dem Postfach antworten.
      replyTo: inquiry.email,
      subject: inquiryNotificationSubject(inquiry, typeLabel),
      text: inquiryNotificationText({
        inquiry,
        typeLabel,
        fieldLabels: INQUIRY_FIELD_LABELS,
        dashboardUrl: `${MAIL_SITE_URL}/admin/anfragen`,
        receivedAt: new Date(),
      }),
    });
  } catch (e) {
    console.error("[email] Versand fehlgeschlagen:", e);
  }
}

/** Testmail aus dem Admin-Dashboard: prüft SMTP + Empfängeradressen, ohne echte Anfrage. */
export async function sendNotificationTestMail(to: string[]): Promise<{ ok: boolean; message: string }> {
  const mailer = transporter();
  if (!mailer) return { ok: false, message: "SMTP-Zugangsdaten fehlen – bitte Env-Variablen prüfen." };
  if (!to.length) return { ok: false, message: "Keine gültige Empfängeradresse hinterlegt." };
  try {
    await mailer.sendMail({
      from: sender(),
      to,
      subject: "Testmail: Anfrage-Benachrichtigung funktioniert",
      text: [
        "Das ist eine Testmail aus dem Mission-Control-Dashboard.",
        "",
        "Wenn du sie liest, werden Benachrichtigungen über neue Anfragen an diese Adresse zugestellt.",
        `Empfänger dieser Testmail: ${to.join(", ")}`,
        "",
        "Tipp: Landet die Mail im Spam-Ordner, einmal auf „Kein Spam“ klicken und den Absender",
        "zu den Kontakten hinzufügen — das verbessert die Zustellung dauerhaft.",
        "",
        "---",
        `Einstellungen: ${MAIL_SITE_URL}/admin/einstellungen`,
      ].join("\n"),
    });
    return { ok: true, message: `Testmail verschickt an: ${to.join(", ")}` };
  } catch (e) {
    console.error("[email] Testmail fehlgeschlagen:", e);
    return { ok: false, message: `Testmail fehlgeschlagen: ${(e as Error).message}` };
  }
}

/** Kurze Text-Alternative zur HTML-Bestätigung (Nodemailer verschickt beides gemeinsam). */
function confirmationText(inquiry: Pick<Inquiry, "type" | "name" | "payload">): string {
  const site = MAIL_SITE_URL;
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
export async function sendInquiryConfirmation(
  inquiry: Pick<Inquiry, "type" | "name" | "email" | "message" | "payload">,
  settings?: NotificationSettings,
) {
  const mailer = transporter();
  if (!mailer) {
    console.warn("[email] SMTP-Zugangsdaten fehlen – Bestätigungsmail übersprungen.");
    return;
  }
  try {
    const { subject, html } = renderInquiryConfirmation(inquiry);
    const resolved = settings ?? (await getNotificationSettings());
    // Antworten des Kunden auf die Bestätigung landen im richtigen Postfach statt im Versand-Account.
    const replyTo = recipientsFor(inquiry.type, { ...resolved, all: "" })[0];
    await mailer.sendMail({
      from: sender(),
      to: inquiry.email,
      replyTo,
      subject,
      html,
      text: confirmationText(inquiry),
    });
  } catch (e) {
    console.error("[email] Bestätigungsmail fehlgeschlagen:", e);
  }
}
