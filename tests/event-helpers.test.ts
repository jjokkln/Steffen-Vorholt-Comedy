import { test } from "node:test";
import assert from "node:assert/strict";
import { partitionEvents, formatDay, formatMonth, formatDateLong } from "../lib/event-helpers.ts";

test("partitionEvents trennt und sortiert", () => {
  const events = [
    { date: "2026-04-09" }, // vergangen (heute = 2026-06-12)
    { date: "2026-07-01" },
    { date: "2026-06-20" },
    { date: "2026-02-12" },
  ];
  const { upcoming, past } = partitionEvents(events, "2026-06-12");
  assert.deepEqual(upcoming.map((e) => e.date), ["2026-06-20", "2026-07-01"]); // aufsteigend
  assert.deepEqual(past.map((e) => e.date), ["2026-04-09", "2026-02-12"]); // absteigend
});

test("Event am heutigen Tag zählt als kommend", () => {
  const { upcoming } = partitionEvents([{ date: "2026-06-12" }], "2026-06-12");
  assert.equal(upcoming.length, 1);
});

test("formatDay/formatMonth/formatDateLong deutsch", () => {
  assert.equal(formatDay("2026-04-09"), "09");
  assert.equal(formatMonth("2026-04-09"), "Apr 2026");
  assert.equal(formatDateLong("2026-04-09"), "9. April 2026");
});
