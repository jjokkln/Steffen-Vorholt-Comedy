"use client";

import { useEffect, useState } from "react";
import { buildCalendarCells, monthTitle, shiftMonth } from "@/lib/calendar-helpers";
import { formatDateLong, todayIso } from "@/lib/event-helpers";
import type { EventRow } from "@/lib/types";

/**
 * Startmonat: der laufende Monat, wenn dort etwas gespielt wird – sonst der
 * Monat des nächsten Termins. Ohne das landet man auf einem leeren Raster,
 * obwohl die erste Show nur zwei Monate später ist (Juli 2026: 0 Termine,
 * ab September wieder welche).
 */
function startMonth(events: EventRow[], year: number, month: number, today: string) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  if (events.some((e) => e.date.startsWith(prefix))) return { year, month };
  const next = events
    .filter((e) => e.date >= today)
    .map((e) => e.date)
    .sort()[0];
  if (!next) return { year, month };
  return { year: Number(next.slice(0, 4)), month: Number(next.slice(5, 7)) };
}

export default function Calendar({
  events,
  initialYear,
  initialMonth,
}: {
  events: EventRow[];
  initialYear: number;
  initialMonth: number;
}) {
  // Deterministisch aus den Props berechnet → Server und Client rendern gleich.
  const [{ year, month }, setYm] = useState(() =>
    startMonth(events, initialYear, initialMonth, todayIso()),
  );
  // Ausgewählter Tag steuert nur die Mobil-Liste unter dem Raster (auf Desktop
  // stehen die Termine direkt in den Zellen). null = ganzer Monat.
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const goToToday = () => {
    const today = new Date();
    setYm({ year: today.getFullYear(), month: today.getMonth() + 1 });
  };
  // Monatswechsel setzt die Tagesauswahl zurück – sonst zeigt die Liste einen
  // Tag, der im neuen Raster gar nicht mehr sichtbar ist.
  useEffect(() => setSelectedIso(null), [year, month]);

  const byIso = new Map<string, EventRow[]>();
  for (const e of events) {
    byIso.set(e.date, [...(byIso.get(e.date) ?? []), e]);
  }
  const cells = buildCalendarCells(year, month);
  const today = todayIso();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthEvents = events
    .filter((e) => e.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));
  const listEvents = selectedIso ? (byIso.get(selectedIso) ?? []) : monthEvents;
  // Leerer Monat: nächstgelegener Monat mit Terminen (erst vorwärts, sonst rückwärts),
  // damit man sich nicht Monat für Monat durch leere Raster klicken muss.
  const dates = events.map((e) => e.date).sort();
  const nearest = monthEvents.length
    ? null
    : (dates.find((d) => d > monthPrefix) ?? [...dates].reverse().find((d) => d < monthPrefix));
  const nextMonthWithEvents = nearest
    ? { year: Number(nearest.slice(0, 4)), month: Number(nearest.slice(5, 7)) }
    : null;

  return (
    <div>
      <div className="calendar-head">
        <div>
          <h3>{monthTitle(year, month)}</h3>
        </div>
        <div className="actions calendar-nav" style={{ marginTop: 0 }}>
          <button
            className="btn secondary calendar-step"
            type="button"
            aria-label="Vorheriger Monat"
            onClick={() => setYm(shiftMonth(year, month, -1))}
          >
            <span aria-hidden="true">←</span>
            <span className="calendar-step-label">Vorheriger</span>
          </button>
          <button className="btn calendar-today" type="button" onClick={goToToday}>
            Heute
          </button>
          <button
            className="btn secondary calendar-step"
            type="button"
            aria-label="Nächster Monat"
            onClick={() => setYm(shiftMonth(year, month, 1))}
          >
            <span className="calendar-step-label">Nächster</span>
            <span aria-hidden="true">→</span>
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
            <div
              className={`calendar-cell ${cell.day ? "" : "dim"}`}
              key={i}
              data-today={cell.iso === today ? "true" : undefined}
              data-active={cell.iso && cell.iso === selectedIso ? "true" : undefined}
              data-events={items.length ? "true" : undefined}
            >
              {/* Auf Desktop nur die Tageszahl (pointer-events:none), auf Mobile der
                  Tages-Button: Zahl + farbige Punkte, Tap füllt die Liste darunter. */}
              <button
                type="button"
                className="calendar-cell-number"
                disabled={!cell.iso}
                aria-label={
                  cell.iso
                    ? `${formatDateLong(cell.iso)}${items.length ? ` – ${items.length} Termin${items.length === 1 ? "" : "e"}` : " – keine Show"}`
                    : undefined
                }
                onClick={() => cell.iso && setSelectedIso(selectedIso === cell.iso ? null : cell.iso)}
              >
                <span className="calendar-cell-day">{cell.day ?? ""}</span>
                {items.length > 0 && (
                  <span className="calendar-cell-dots" aria-hidden="true">
                    {items.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="calendar-cell-dot"
                        style={{ background: e.shows?.color ?? "#7CFF6B" }}
                      />
                    ))}
                  </span>
                )}
              </button>
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

      {/* Nur Mobile: Termine als lesbare Liste statt in 3 mm breiten Zellen. */}
      <div className="calendar-daylist">
        <div className="calendar-daylist-head">
          <span>{selectedIso ? formatDateLong(selectedIso) : `Termine im ${monthTitle(year, month)}`}</span>
          {selectedIso && (
            <button type="button" className="chip calendar-daylist-reset" onClick={() => setSelectedIso(null)}>
              Ganzer Monat
            </button>
          )}
        </div>
        {listEvents.length > 0 ? (
          <ul className="calendar-daylist-items">
            {listEvents.map((e) => (
              <li key={e.id}>
                <a
                  className="calendar-daylist-row"
                  style={{ borderLeftColor: e.shows?.color ?? "#7CFF6B" }}
                  href={e.ticket_url || `/shows/${e.shows?.slug ?? ""}`}
                  target={e.ticket_url ? "_blank" : "_self"}
                  rel="noreferrer"
                >
                  <span className="calendar-daylist-date">{Number(e.date.slice(8, 10))}.</span>
                  <span className="calendar-daylist-body">
                    <strong>{e.shows?.name}</strong>
                    <span>
                      {[e.city, e.venue].filter(Boolean).join(" · ")}
                      {e.start_time ? ` · ${e.start_time}` : ""}
                    </span>
                  </span>
                  <span className="calendar-daylist-cue" aria-hidden="true">
                    {e.ticket_url ? "🎟" : "→"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : nextMonthWithEvents ? (
          <div className="calendar-daylist-jump">
            <p className="calendar-daylist-empty">
              {selectedIso ? "An diesem Tag ist keine Show geplant." : "In diesem Monat ist keine Show geplant."}
            </p>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setSelectedIso(null);
                setYm(nextMonthWithEvents);
              }}
            >
              Zum nächsten Termin ({monthTitle(nextMonthWithEvents.year, nextMonthWithEvents.month)})
            </button>
          </div>
        ) : (
          <p className="calendar-daylist-empty">
            {selectedIso ? "An diesem Tag ist keine Show geplant." : "In diesem Monat ist keine Show geplant."}
          </p>
        )}
      </div>
    </div>
  );
}
