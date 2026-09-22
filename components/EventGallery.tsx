"use client";

import { useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow } from "@/lib/types";

/** Erste Portion Termine; der Rest kommt per Klick nach. */
const PAGE_SIZE = 9;

/**
 * Termine als Kartenraster, portionsweise.
 *
 * Filtert selbst NICHT mehr (21.09.2026): Der Filter der /shows-Termine sitzt
 * jetzt über dem Kalender und gilt für Monatsansicht, Karte und Liste zugleich —
 * components/shows/TermineFilterBar.tsx. Die frühere Filterzeile in dieser
 * Komponente hatte danach keinen Aufrufer mehr; sie stehenzulassen hätte zwei
 * Filterwege nebeneinander suggeriert, von denen nur einer läuft.
 * Der Aufrufer übergibt also bereits gefilterte Termine — und soll die Liste
 * bei einem Filterwechsel über `key` neu aufsetzen, sonst zeigt sie weiter so
 * viele Portionen wie zuvor aufgeklappt.
 */
export default function EventGallery({
  events,
  limit,
  emptyText,
}: {
  events: EventRow[];
  limit?: number;
  /** Text, wenn nichts übrig bleibt — beim gefilterten Aufruf lautet er anders. */
  emptyText?: string;
}) {
  // 77 Termine als Karten sind auf dem Handy ~20.000 px Scroll – deshalb
  // portionsweise nachladen, sofern der Aufrufer kein festes Limit setzt.
  const [visible, setVisible] = useState(PAGE_SIZE);
  const items = limit ? events.slice(0, limit) : events.slice(0, visible);
  const rest = limit ? 0 : events.length - items.length;

  return (
    <>
      <div className="grid-3" data-events-grid>
        {items.length ? (
          items.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="booking-empty">
            {emptyText ?? "Aktuell keine Termine geplant — Steffen arbeitet dran."}
          </div>
        )}
      </div>
      {rest > 0 && (
        <div className="event-more">
          <button type="button" className="btn secondary" onClick={() => setVisible(visible + PAGE_SIZE)}>
            {rest} weitere {rest === 1 ? "Termin" : "Termine"} anzeigen
          </button>
          <span>
            {items.length} von {events.length}
          </span>
        </div>
      )}
    </>
  );
}
