"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow } from "@/lib/types";

/** Shared event-gallery filtering, used wherever appointments are shown as cards. */
export default function EventGallery({ events, limit }: { events: EventRow[]; limit?: number }) {
  const [selectedShows, setSelectedShows] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const { shows, cities } = useMemo(() => {
    const shows = [...new Map(events.filter((e) => e.shows).map((e) => [e.shows!.slug, e.shows!.name])).entries()];
    const cities = [...new Set(events.map((e) => e.city))].sort();
    return { shows, cities };
  }, [events]);
  const filtered = events.filter((event) => {
    const matchesShow = selectedShows.length === 0 || selectedShows.includes(event.shows?.slug ?? "");
    const matchesCity = selectedCities.length === 0 || selectedCities.includes(event.city);
    return matchesShow && matchesCity;
  });
  const items = limit ? filtered.slice(0, limit) : filtered;
  const toggle = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <>
      <div className="event-filter-groups" aria-label="Termine filtern">
        <button type="button" className={`chip event-filter-reset${selectedShows.length === 0 && selectedCities.length === 0 ? " active" : ""}`} onClick={() => { setSelectedShows([]); setSelectedCities([]); }}>
          Alle
        </button>
        <div className="event-filter-group">
          <span className="event-filter-label">Show</span>
          <div className="filters event-gallery-filters">
            {shows.map(([slug, name]) => <button key={slug} type="button" aria-pressed={selectedShows.includes(slug)} className={`chip${selectedShows.includes(slug) ? " active" : ""}`} onClick={() => toggle(slug, selectedShows, setSelectedShows)}>{name}</button>)}
          </div>
        </div>
        <div className="event-filter-group">
          <span className="event-filter-label">Ort</span>
          <div className="filters event-gallery-filters">
            {cities.map((city) => <button key={city} type="button" aria-pressed={selectedCities.includes(city)} className={`chip${selectedCities.includes(city) ? " active" : ""}`} onClick={() => toggle(city, selectedCities, setSelectedCities)}>{city}</button>)}
          </div>
        </div>
      </div>
      <div className="grid-3" data-events-grid>
        {items.length ? items.map((event) => <EventCard key={event.id} event={event} />) : (
          <div className="booking-empty">Für diesen Filter ist nichts geplant — Steffen arbeitet dran.</div>
        )}
      </div>
    </>
  );
}
