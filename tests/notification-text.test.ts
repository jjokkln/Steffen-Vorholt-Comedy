import { test } from "node:test";
import assert from "node:assert/strict";
import { inquiryNotificationSubject, inquiryNotificationText } from "../lib/notification-text.ts";

const FIELD_LABELS = {
  show: "Show",
  event_date: "Wunschdatum",
  city: "Stadt / Location",
  video_requested: "Video gewünscht",
  company: "Firma / Veranstalter",
  event_type: "Art der Veranstaltung",
};

const RECEIVED_AT = new Date("2026-07-26T14:05:00Z");

function build(overrides: Partial<Parameters<typeof inquiryNotificationText>[0]> = {}) {
  return inquiryNotificationText({
    inquiry: {
      type: "booking_show",
      name: "Anna Beispiel",
      email: "anna@example.com",
      phone: "0211 12345",
      message: "Wir wollen die Show im Herbst.",
      payload: { show: "Comedy Eiskalt", event_date: "15.03.2027", city: "Neuss", video_requested: "ja" },
    },
    typeLabel: "Booking: Show",
    fieldLabels: FIELD_LABELS,
    dashboardUrl: "https://www.steffenvorholt.de/admin/anfragen",
    receivedAt: RECEIVED_AT,
    ...overrides,
  });
}

test("Betreff nennt Typ und Name, ohne Emoji", () => {
  const subject = inquiryNotificationSubject({
    type: "booking_show",
    name: "Anna Beispiel",
    email: "anna@example.com",
    phone: "",
    message: "",
    payload: {},
  }, "Booking: Show");
  assert.equal(subject, "Neue Anfrage: Booking: Show – Anna Beispiel");
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(subject));
});

test("Text enthält alle Stammdaten und die typ-spezifischen Felder mit deutschen Labels", () => {
  const text = build();
  assert.match(text, /Name:\s+Anna Beispiel/);
  assert.match(text, /E-Mail:\s+anna@example\.com/);
  assert.match(text, /Telefon:\s+0211 12345/);
  assert.match(text, /Show:\s+Comedy Eiskalt/);
  assert.match(text, /Wunschdatum:\s+15\.03\.2027/);
  assert.match(text, /Stadt \/ Location:\s+Neuss/);
  assert.match(text, /Video gewünscht:\s+ja/);
  assert.ok(text.includes("Wir wollen die Show im Herbst."));
  assert.ok(text.includes("https://www.steffenvorholt.de/admin/anfragen"));
});

test("Eingangszeitpunkt wird in deutscher Schreibweise und Berliner Zeit ausgegeben", () => {
  // 14:05 UTC = 16:05 Sommerzeit in Berlin
  assert.match(build(), /Eingegangen:\s+.*26\.\s*Juli 2026 um 16:05/);
});

test("Leere Felder werden ausgelassen bzw. mit — gefüllt", () => {
  const text = build({
    inquiry: {
      type: "frage_feedback",
      name: "Chris",
      email: "chris@example.com",
      phone: "",
      message: "",
      payload: {},
    },
    typeLabel: "Frage / Feedback",
  });
  assert.match(text, /Telefon:\s+—/);
  assert.ok(text.includes("(keine Nachricht hinterlassen)"));
  assert.ok(!text.includes("Show:"));
});
