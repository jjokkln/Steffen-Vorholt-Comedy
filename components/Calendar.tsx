"use client";

import { useState } from "react";
import { buildCalendarCells, monthTitle, shiftMonth } from "@/lib/calendar-helpers";
import type { EventRow } from "@/lib/types";

export default function Calendar({
  events,
  initialYear,
  initialMonth,
}: {
  events: EventRow[];
  initialYear: number;
  initialMonth: number;
}) {
  const [{ year, month }, setYm] = useState({ year: initialYear, month: initialMonth });
  const byIso = new Map<string, EventRow[]>();
  for (const e of events) {
    byIso.set(e.date, [...(byIso.get(e.date) ?? []), e]);
  }
  const cells = buildCalendarCells(year, month);

  return (
    <div>
      <div className="calendar-head">
        <div>
          <span className="badge">Kalenderansicht</span>
          <h3>{monthTitle(year, month)}</h3>
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn secondary" type="button" onClick={() => setYm(shiftMonth(year, month, -1))}>
            ← Vorheriger
          </button>
          <button className="btn secondary" type="button" onClick={() => setYm(shiftMonth(year, month, 1))}>
            Nächster →
          </button>
        </div>
      </div>
      <div className="calendar-grid-large" data-calendar-grid>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div className="calendar-weekday" key={d}>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const items = cell.iso ? (byIso.get(cell.iso) ?? []) : [];
          return (
            <div className={`calendar-cell ${cell.day ? "" : "dim"}`} key={i}>
              <div className="calendar-cell-number">{cell.day ?? ""}</div>
              {items.map((e) => (
                <a
                  key={e.id}
                  className="calendar-event"
                  style={{ background: e.shows?.color ?? "#7CFF6B", color: "#050711" }}
                  href={e.ticket_url || `/shows/${e.shows?.slug ?? ""}`}
                  target={e.ticket_url ? "_blank" : "_self"}
                  rel="noreferrer"
                >
                  {e.shows?.name}
                  <br />
                  {e.city}
                </a>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
