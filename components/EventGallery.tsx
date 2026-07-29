"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow } from "@/lib/types";

/** Erste Portion Termine; der Rest kommt per Klick nach. */
const PAGE_SIZE = 9;

/** Shared event-gallery filtering, used wherever appointments are shown as cards. */
export default function EventGallery({
  events,
  limit,
  showFilters = true,
}: {
  events: EventRow[];
  limit?: number;
  showFilters?: boolean;
}) {
  const [selectedShows, setSelectedShows] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  // 77 Termine als Karten sind auf dem Handy ~20.000 px Scroll – deshalb
  // portionsweise nachladen, sofern der Aufrufer kein festes Limit setzt.
  const [visible, setVisible] = useState(PAGE_SIZE);
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
  const items = limit ? filtered.slice(0, limit) : filtered.slice(0, visible);
  const rest = limit ? 0 : filtered.length - items.length;
  const toggle = (value: string, selected: string[], setSelected: (next: string[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
    // Nach einem Filterwechsel wieder von vorn zählen, sonst bleibt eine kurze
    // Ergebnisliste hinter einem längst aufgeklappten Stand versteckt.
    setVisible(PAGE_SIZE);
  };

  return (
    <>
      {showFilters && (
      <div className="event-filter-groups" aria-label="Termine filtern">
        <button type="button" className={`chip event-filter-reset${selectedShows.length === 0 && selectedCities.length === 0 ? " active" : ""}`} onClick={() => { setSelectedShows([]); setSelectedCities([]); setVisible(PAGE_SIZE); }}>
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
      )}
      <div className="grid-3" data-events-grid>
        {items.length ? items.map((event) => <EventCard key={event.id} event={event} />) : (
          <div className="booking-empty">
            {showFilters
              ? "Für diesen Filter ist nichts geplant — Steffen arbeitet dran."
              : "Aktuell keine Termine geplant — Steffen arbeitet dran."}
          </div>
        )}
      </div>
      {rest > 0 && (
        <div className="event-more">
          <button type="button" className="btn secondary" onClick={() => setVisible(visible + PAGE_SIZE)}>
            {rest} weitere {rest === 1 ? "Termin" : "Termine"} anzeigen
          </button>
          <span>
            {items.length} von {filtered.length}
          </span>
        </div>
      )}
    </>
  );
}
