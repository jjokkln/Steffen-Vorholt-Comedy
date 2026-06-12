"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow, Show } from "@/lib/types";

export default function TermineFilters({ events, shows }: { events: EventRow[]; shows: Show[] }) {
  const [active, setActive] = useState("all");
  const cities = useMemo(() => [...new Set(events.map((e) => e.city))].sort(), [events]);
  const filters = [
    { value: "all", label: "Alle" },
    ...shows.map((s) => ({ value: `show:${s.slug}`, label: s.name })),
    ...cities.map((c) => ({ value: `city:${c}`, label: c })),
  ];
  const items = events.filter((e) => {
    if (active === "all") return true;
    if (active.startsWith("show:")) return e.shows?.slug === active.slice(5);
    return e.city === active.slice(5);
  });

  return (
    <>
      <div className="filters" data-filters>
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip${active === f.value ? " active" : ""}`}
            onClick={() => setActive(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid-3" data-events-grid>
        {items.length ? (
          items.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="booking-empty">Für diesen Filter ist nichts geplant — Steffen arbeitet dran.</div>
        )}
      </div>
    </>
  );
}
