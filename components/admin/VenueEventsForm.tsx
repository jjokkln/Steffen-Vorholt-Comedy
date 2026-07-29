"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createVenueEvents, type FormState } from "@/lib/actions/events";
import { SERIES_INTERVALS, isIsoDate, normalizeDates, seriesDates, type SeriesInterval } from "@/lib/bulk-dates";
import { formatDateLong } from "@/lib/event-helpers";
import type { EventRow, Show, Venue } from "@/lib/types";

/**
 * Mehrere Termine auf einmal an einem Spielort anlegen. Stadt und Location
 * kommen aus dem Standort, gesammelt werden nur die Daten — einzeln per
 * Datumsfeld oder als Serie („monatlich × 6").
 */
export default function VenueEventsForm({
  venue,
  shows,
  existing,
  onDone,
}: {
  venue: Venue;
  shows: Show[];
  /** Schon angelegte Termine dieses Orts – als Kontext, damit man nicht doppelt plant. */
  existing: EventRow[];
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createVenueEvents.bind(null, venue.id),
    null,
  );
  const [dates, setDates] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [interval, setInterval] = useState<SeriesInterval>("monthly");
  const [count, setCount] = useState(4);
  const lastSaved = useRef(0);

  // Nach dem Speichern die Liste leeren, aber Show/Zeiten stehen lassen: der
  // nächste Block Termine ist meist dieselbe Show zur selben Uhrzeit.
  useEffect(() => {
    if (state?.ok && state.at !== lastSaved.current) {
      lastSaved.current = state.at;
      setDates([]);
      setDraft("");
    }
  }, [state]);

  const add = (values: string[]) => {
    setDates((prev) => normalizeDates([...prev, ...values]));
  };

  const addDraft = () => {
    if (!isIsoDate(draft)) return;
    add([draft]);
    setDraft("");
  };

  const existingDates = new Set(existing.map((e) => e.date));

  return (
    <form className="venue-events" action={formAction}>
      {/* Anzahl der Datumsfelder soll nicht am DOM hängen – deshalb eine Liste. */}
      <input type="hidden" name="dates" value={dates.join(",")} />

      <div className="form two">
        <label>
          <span>Show *</span>
          <select name="show_id" defaultValue={venue.show_id ?? shows[0]?.id ?? ""} required>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Datum hinzufügen</span>
          <div className="venue-events-add">
            <input
              type="date"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              // Enter im Datumsfeld soll das Datum übernehmen, nicht das ganze
              // Formular abschicken.
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDraft();
                }
              }}
            />
            <button type="button" className="btn secondary" disabled={!isIsoDate(draft)} onClick={addDraft}>
              +
            </button>
          </div>
        </label>
      </div>

      <div className="venue-events-series">
        <span>Serie ab diesem Datum:</span>
        <select value={interval} onChange={(e) => setInterval(e.target.value as SeriesInterval)}>
          {SERIES_INTERVALS.map((i) => (
            <option key={i.key} value={i.key}>
              {i.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={52}
          value={count}
          onChange={(e) => setCount(Math.min(52, Math.max(1, Number(e.target.value) || 1)))}
          aria-label="Anzahl Termine der Serie"
        />
        <span>Termine</span>
        <button
          type="button"
          className="btn secondary"
          disabled={!isIsoDate(draft)}
          title={isIsoDate(draft) ? undefined : "Erst ein Startdatum wählen"}
          onClick={() => {
            add(seriesDates(draft, interval, count));
            setDraft("");
          }}
        >
          Serie erzeugen
        </button>
      </div>

      <div className="venue-events-list">
        {dates.length === 0 ? (
          <p className="map-admin-empty">
            Noch kein Datum gewählt — einzeln hinzufügen oder eine Serie erzeugen.
          </p>
        ) : (
          dates.map((d) => (
            <span key={d} className={`date-chip${existingDates.has(d) ? " is-dupe" : ""}`}>
              {formatDateLong(d)}
              {existingDates.has(d) && <em>schon angelegt</em>}
              <button type="button" onClick={() => setDates((prev) => prev.filter((x) => x !== d))} aria-label={`${formatDateLong(d)} entfernen`}>
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      <div className="form two">
        <label>
          <span>Showbeginn</span>
          <input name="start_time" placeholder="20:00" defaultValue="20:00" />
        </label>
        <label>
          <span>Einlass</span>
          <input name="entry_time" placeholder="19:00" defaultValue="19:00" />
        </label>
      </div>
      <div className="form two">
        <label>
          <span>Ticketlink (für alle)</span>
          <input name="ticket_url" type="url" placeholder="https://…" />
        </label>
        <label>
          <span>Anbieter</span>
          <input name="provider" placeholder="z. B. Eventbrite" />
        </label>
      </div>
      <label className="checkbox-row">
        <input name="is_published" type="checkbox" defaultChecked /> Alle direkt veröffentlichen
      </label>

      <div className="actions">
        <button className="btn primary" disabled={pending || dates.length === 0}>
          {pending
            ? "Legt an…"
            : `${dates.length || ""} ${dates.length === 1 ? "Termin" : "Termine"} anlegen`.trim()}
        </button>
        {onDone && (
          <button type="button" className="btn secondary" onClick={onDone} disabled={pending}>
            Schließen
          </button>
        )}
      </div>

      {state && (
        <p className={state.ok ? "map-admin-ok" : "map-admin-err"} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
