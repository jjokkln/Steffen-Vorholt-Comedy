import fs from "node:fs";
import path from "node:path";
import type { Inquiry, InquiryType } from "@/lib/types";
// Relativ und mit Endung: wird von tests/email-templates.test.ts über `node --test` geladen.
import { escapeHtml } from "./html.ts";

const TEMPLATE_FILES: Record<InquiryType, string> = {
  booking_show: "booking-show.html",
  booking_steffen: "booking-steffen.html",
  frage_feedback: "frage-feedback.html",
};

// Bewusst ohne Emoji: Emoji im Betreff ist bei einem Freemail-Absender ein zusätzliches
// Spam-Signal. Der Markenname im Betreff hilft stattdessen beim Wiedererkennen.
const SUBJECTS: Record<InquiryType, string> = {
  booking_show: "Deine Show-Anfrage bei Steffen Vorholt ist angekommen",
  booking_steffen: "Ihre Booking-Anfrage bei Steffen Vorholt ist eingegangen",
  frage_feedback: "Danke für deine Nachricht an Steffen Vorholt",
};

type ConfirmationInput = Pick<Inquiry, "type" | "name" | "message" | "payload">;

function fillTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in vars ? vars[key] : match));
}

/** Werte pro Formulartyp — Freitext-Felder (Nutzereingabe) werden escaped, Fallback „—" bei Leerfeldern. */
function variablesFor(inquiry: ConfirmationInput): Record<string, string> {
  const name = escapeHtml(inquiry.name);
  const message = escapeHtml(inquiry.message || "—");
  const field = (key: string, fallback = "—") => escapeHtml(inquiry.payload[key] || fallback);

  switch (inquiry.type) {
    case "booking_show":
      return {
        name,
        message,
        show: field("show"),
        event_date: field("event_date", "nach Absprache"),
        city: field("city"),
        // „Video" heißt: Steffen schickt dem Interessenten vorab einen Ausschnitt aus SEINER
        // Show, damit klar ist, was gebucht wird. Es ist KEINE Aufnahme der Veranstaltung des
        // Anfragenden — der alte Text („ein Video von deiner Show") hat genau das versprochen.
        video_note:
          inquiry.payload.video_requested === "ja"
            ? "🎥 Steffen schickt dir vorab einen Videoausschnitt aus der Show, damit du vor der Buchung siehst, was dich erwartet."
            : "",
      };
    case "booking_steffen":
      return {
        name,
        message,
        company: field("company"),
        event_type: field("event_type"),
        event_date: field("event_date", "nach Absprache"),
      };
    case "frage_feedback":
      return { name, message };
  }
}

/** Rendert die passende Bestätigungs-Mail-Vorlage mit den echten (escapten) Werten der Anfrage. */
export function renderInquiryConfirmation(inquiry: ConfirmationInput): { subject: string; html: string } {
  const file = path.join(process.cwd(), "lib", "email-templates", TEMPLATE_FILES[inquiry.type]);
  const html = fs.readFileSync(file, "utf-8");
  return { subject: SUBJECTS[inquiry.type], html: fillTemplate(html, variablesFor(inquiry)) };
}
