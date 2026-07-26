import type { Inquiry } from "@/lib/types";

/**
 * Reine Textbausteine der Admin-Benachrichtigung (bewusst Plaintext, keine Vorlage:
 * Steffen soll die Anfrage direkt im Posteingang lesen können, auch in der Vorschau).
 * Modul ohne Laufzeit-Imports, damit es in `npm test` direkt geladen werden kann.
 */

export type NotificationInquiry = Pick<Inquiry, "type" | "name" | "email" | "phone" | "message" | "payload">;

export interface NotificationTextInput {
  inquiry: NotificationInquiry;
  /** Klartext des Anfragetyps, z. B. „Booking: Show". */
  typeLabel: string;
  /** Beschriftungen der payload-Felder (aus INQUIRY_FIELD_LABELS). */
  fieldLabels: Record<string, string>;
  /** Link zur Anfragen-Liste im Dashboard. */
  dashboardUrl: string;
  receivedAt: Date;
}

const DASH = "—";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(date);
}

/** Betreff der Admin-Mail. Ohne Emoji – Freemail-Absender + Emoji ist ein Spam-Signal. */
export function inquiryNotificationSubject(inquiry: NotificationInquiry, typeLabel: string): string {
  return `Neue Anfrage: ${typeLabel} – ${inquiry.name}`;
}

/** Feste Spaltenbreite, damit die Werte im Posteingang untereinander stehen. */
function row(label: string, value: string): string {
  return `${`${label}:`.padEnd(20)}${value || DASH}`;
}

export function inquiryNotificationText(input: NotificationTextInput): string {
  const { inquiry, typeLabel, fieldLabels, dashboardUrl, receivedAt } = input;

  const lines = [
    `Neue Anfrage über die Website – ${typeLabel}`,
    "",
    row("Eingegangen", formatDateTime(receivedAt)),
    row("Art der Anfrage", typeLabel),
    row("Name", inquiry.name),
    row("E-Mail", inquiry.email),
    row("Telefon", inquiry.phone),
  ];

  // Typ-spezifische Felder in der Reihenfolge, in der sie im Formular stehen.
  for (const [key, value] of Object.entries(inquiry.payload)) {
    if (!value) continue;
    lines.push(row(fieldLabels[key] ?? key, value));
  }

  lines.push(
    "",
    "Nachricht:",
    inquiry.message.trim() || "(keine Nachricht hinterlassen)",
    "",
    "---",
    `Direkt antworten: Auf diese Mail antworten geht an ${inquiry.email}.`,
    `Im Dashboard ansehen: ${dashboardUrl}`,
  );

  return lines.join("\n");
}
