import fs from "node:fs";
import path from "node:path";
import type { Inquiry, InquiryType } from "@/lib/types";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const TEMPLATE_FILES: Record<InquiryType, string> = {
  booking_show: "booking-show.html",
  booking_steffen: "booking-steffen.html",
  frage_feedback: "frage-feedback.html",
};

const SUBJECTS: Record<InquiryType, string> = {
  booking_show: "🎟️ Deine Show-Anfrage ist angekommen",
  booking_steffen: "🎤 Ihre Booking-Anfrage ist eingegangen",
  frage_feedback: "💬 Danke für deine Nachricht",
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
        video_note:
          inquiry.payload.video_requested === "ja"
            ? "🎥 Du bekommst zusätzlich ein Video von deiner Show."
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
