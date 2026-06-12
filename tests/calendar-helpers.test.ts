import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCalendarCells, monthTitle, shiftMonth } from "../lib/calendar-helpers.ts";

test("Januar 2024 beginnt Montag (kein Offset)", () => {
  const cells = buildCalendarCells(2024, 1);
  assert.equal(cells[0].day, 1);
  assert.equal(cells[0].iso, "2024-01-01");
  assert.equal(cells.length % 7, 0);
});

test("Februar 2024 beginnt Donnerstag (Offset 3) und hat 29 Tage", () => {
  const cells = buildCalendarCells(2024, 2);
  assert.equal(cells[0].day, null);
  assert.equal(cells[3].day, 1);
  assert.equal(cells.filter((c) => c.day !== null).length, 29);
});

test("monthTitle deutsch", () => {
  assert.equal(monthTitle(2026, 6), "Juni 2026");
});

test("shiftMonth über Jahresgrenzen", () => {
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
});
