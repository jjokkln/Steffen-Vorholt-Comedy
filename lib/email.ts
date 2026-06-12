import { Resend } from "resend";
import type { Inquiry } from "@/lib/types";

const TYPE_LABEL = { booking: "Booking-Anfrage", comedian: "Comedian-Bewerbung" } as const;

/** Versand best-effort: Fehler werden geloggt, niemals geworfen. */
export async function sendInquiryNotification(inquiry: Pick<Inquiry, "type" | "name" | "email" | "phone" | "message" | "payload">) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    console.warn("[email] RESEND_API_KEY/NOTIFICATION_EMAIL fehlt – Benachrichtigung übersprungen.");
    return;
  }
  const extras = Object.entries(inquiry.payload)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  try {
    await new Resend(apiKey).emails.send({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      replyTo: inquiry.email,
      subject: `🛸 Neue ${TYPE_LABEL[inquiry.type]} von ${inquiry.name}`,
      text: `Name: ${inquiry.name}\nE-Mail: ${inquiry.email}\nTelefon: ${inquiry.phone || "—"}\n${extras}\n\nNachricht:\n${inquiry.message}\n\n→ Dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de"}/admin/anfragen`,
    });
  } catch (e) {
    console.error("[email] Versand fehlgeschlagen:", e);
  }
}
