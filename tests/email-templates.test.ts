import { test } from "node:test";
import assert from "node:assert/strict";
import { renderInquiryConfirmation } from "../lib/email-templates.ts";

test("booking_show: Platzhalter werden ersetzt, video_note optional", () => {
  const { subject, html } = renderInquiryConfirmation({
    type: "booking_show",
    name: "Anna",
    message: "Freu mich schon!",
    payload: { show: "Comedy Eiskalt", event_date: "15.03.2027", city: "Neuss", video_requested: "ja" },
  });
  assert.match(subject, /Show-Anfrage/);
  assert.ok(html.includes("Hi Anna,"));
  assert.ok(html.includes("Comedy Eiskalt"));
  assert.ok(html.includes("15.03.2027"));
  assert.ok(html.includes("Neuss"));
  assert.ok(html.includes("Du bekommst zusätzlich ein Video"));
  assert.ok(!html.includes("{{"));
});

test("booking_show: video_requested leer → video_note-Zeile bleibt leer, kein Platzhalter übrig", () => {
  const { html } = renderInquiryConfirmation({
    type: "booking_show",
    name: "Ben",
    message: "",
    payload: { show: "", event_date: "", city: "", video_requested: "" },
  });
  assert.ok(!html.includes("{{"));
  assert.ok(!html.includes("Du bekommst zusätzlich ein Video"));
  assert.ok(html.includes("nach Absprache")); // event_date-Fallback
});

test("booking_steffen: Platzhalter werden ersetzt", () => {
  const { subject, html } = renderInquiryConfirmation({
    type: "booking_steffen",
    name: "Frau Muster",
    message: "Bitte um Angebot",
    payload: { company: "Muster GmbH", event_type: "Firmenfeier", event_date: "" },
  });
  assert.match(subject, /Booking-Anfrage/);
  assert.ok(html.includes("Muster GmbH"));
  assert.ok(html.includes("Firmenfeier"));
  assert.ok(html.includes("nach Absprache"));
  assert.ok(!html.includes("{{"));
});

test("frage_feedback: Platzhalter werden ersetzt", () => {
  const { subject, html } = renderInquiryConfirmation({
    type: "frage_feedback",
    name: "Chris",
    message: "Tolle Show!",
    payload: {},
  });
  assert.match(subject, /Nachricht/);
  assert.ok(html.includes("Hi Chris,"));
  assert.ok(html.includes("Tolle Show!"));
  assert.ok(!html.includes("{{"));
});

test("Nutzereingaben werden HTML-escaped (XSS-Schutz)", () => {
  const { html } = renderInquiryConfirmation({
    type: "frage_feedback",
    name: '<script>alert(1)</script>',
    message: "Hallo & <b>Gruß</b>",
    payload: {},
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Hallo &amp; &lt;b&gt;Gruß&lt;/b&gt;"));
});
