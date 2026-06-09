"use client";

import { useState } from "react";
import EventCard from "@/components/EventCard";
import { EVENTS } from "@/lib/events";

const FILTERS = [
  { value: "all", label: "Alle" },
  { value: "Brain Loading", label: "Brain Loading" },
  { value: "Comedy Eiskalt", label: "Comedy Eiskalt" },
  { value: "Comedy Check-In", label: "Comedy Check-In" },
  { value: "Oberhausen", label: "Oberhausen" },
  { value: "Bergisch Gladbach", label: "Bergisch Gladbach" },
];

export default function TermineFilters() {
  const [active, setActive] = useState("all");
  const items = EVENTS.filter(
    (ev) => active === "all" || ev.show === active || ev.city.includes(active),
  );

  return (
    <>
      <div className="filters" data-filters>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip${active === f.value ? " active" : ""}`}
            data-filter={f.value}
            onClick={() => setActive(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid-3" data-events-grid>
        {items.length ? (
          items.map((event, i) => <EventCard key={`${event.slug}-${i}`} event={event} />)
        ) : (
          <div className="booking-empty">Noch keine Termine gepflegt.</div>
        )}
      </div>
    </>
  );
}
