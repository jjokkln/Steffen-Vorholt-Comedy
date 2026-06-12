import { test } from "node:test";
import assert from "node:assert/strict";
import { comedyEventJsonLd, personJsonLd, breadcrumbJsonLd } from "../lib/jsonld.ts";

test("comedyEventJsonLd mit Ticketlink", () => {
  const ld = comedyEventJsonLd({
    date: "2026-07-01", start_time: "20:00", city: "Köln", venue: "Club X",
    ticket_url: "https://tickets.example/1", showName: "Brain Loading", slug: "brain-loading",
  });
  assert.equal(ld["@type"], "ComedyEvent");
  assert.equal(ld.name, "Brain Loading – Köln");
  assert.equal(ld.startDate, "2026-07-01T20:00:00");
  assert.equal((ld.offers as { url: string }).url, "https://tickets.example/1");
  assert.equal((ld.performer as { name: string }).name, "Steffen Vorholt");
});

test("comedyEventJsonLd ohne Ticketlink hat keine offers", () => {
  const ld = comedyEventJsonLd({
    date: "2026-07-01", start_time: "", city: "Köln", venue: "",
    ticket_url: "", showName: "Brain Loading", slug: "brain-loading",
  });
  assert.equal(ld.startDate, "2026-07-01");
  assert.ok(!("offers" in ld));
});

test("personJsonLd + breadcrumbJsonLd", () => {
  assert.equal(personJsonLd()["@type"], "Person");
  const bc = breadcrumbJsonLd([{ name: "Shows", path: "/shows" }]);
  assert.equal(bc["@type"], "BreadcrumbList");
});
