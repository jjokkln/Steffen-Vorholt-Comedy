"use client";

import { useEffect, useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow } from "@/lib/types";

const PAGE_SIZE = 6;

/** Kommende Termine einer Show mit Ort-Filter + „Mehr anzeigen" (Show-Subpage). */
export default function ShowUpcomingEvents({ events }: { events: EventRow[] }) {
  const [city, setCity] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const cities = useMemo(
    () => [...new Set(events.map((e) => e.city).filter(Boolean))].sort(),
    [events],
  );
  const filtered = city ? events.filter((e) => e.city === city) : events;
  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [city]);

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
        {visible.length ? (
          visible.map((e) => <EventCard key={e.id} event={e} />)
        ) : (
          <div className="booking-empty">Für diesen Ort ist gerade kein Termin geplant.</div>
        )}
      </div>
      {hasMore && (
        <div className="actions" style={{ justifyContent: "center", marginTop: 24 }}>
          <button type="button" className="btn secondary" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
            Mehr anzeigen ({filtered.length - visible.length} weitere)
          </button>
        </div>
      )}
    </>
  );
}
