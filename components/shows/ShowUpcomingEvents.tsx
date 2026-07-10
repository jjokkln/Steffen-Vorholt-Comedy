"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow } from "@/lib/types";

/** Kommende Termine einer Show mit Ort-Filter (Show-Subpage). */
export default function ShowUpcomingEvents({ events }: { events: EventRow[] }) {
  const [city, setCity] = useState("");
  const cities = useMemo(
    () => [...new Set(events.map((e) => e.city).filter(Boolean))].sort(),
    [events],
  );
  const filtered = city ? events.filter((e) => e.city === city) : events;

  return (
    <>
      {cities.length > 1 && (
        <div className="filters" aria-label="Termine nach Ort filtern">
          <button
            type="button"
            aria-pressed={city === ""}
            className={`chip${city === "" ? " active" : ""}`}
            onClick={() => setCity("")}
          >
            Alle Orte
          </button>
          {cities.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={city === c}
              className={`chip${city === c ? " active" : ""}`}
              onClick={() => setCity(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="grid-3">
        {filtered.length ? (
          filtered.map((e) => <EventCard key={e.id} event={e} />)
        ) : (
          <div className="booking-empty">Für diesen Ort ist gerade kein Termin geplant.</div>
        )}
      </div>
    </>
  );
}
