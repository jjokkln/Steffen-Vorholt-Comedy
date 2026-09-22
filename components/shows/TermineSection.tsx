"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Calendar from "@/components/Calendar";
import EventGallery from "@/components/EventGallery";
import TermineFilterBar from "@/components/shows/TermineFilterBar";
import NRWMap from "@/components/shows/NRWMap";
import type { EventRow, Show, Venue } from "@/lib/types";

type View = "kalender" | "karte";

export default function TermineSection({
  events,
  upcoming,
  shows,
  venues,
  initialYear,
  initialMonth,
}: {
  events: EventRow[];
  upcoming: EventRow[];
  shows: Show[];
  venues: Venue[];
  initialYear: number;
  initialMonth: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>(searchParams.get("view") === "karte" ? "karte" : "kalender");
  // Der Filter steht seit dem 21.09.2026 ÜBER dem Kalender und gilt deshalb für
  // alles darunter: Monatsansicht, Karte und Liste. Ein Filter, der nur die
  // unterste der drei Ansichten beeinflusst, wäre an dieser Stelle eine Lüge.
  const [selectedShows, setSelectedShows] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const passt = useCallback(
    (e: EventRow) =>
      (selectedShows.length === 0 || selectedShows.includes(e.shows?.slug ?? "")) &&
      (selectedCities.length === 0 || selectedCities.includes(e.city)),
    [selectedShows, selectedCities],
  );

  const gefilterteEvents = useMemo(() => events.filter(passt), [events, passt]);
  const gefilterteUpcoming = useMemo(() => upcoming.filter(passt), [upcoming, passt]);
  // Wechselt der Filter, startet die Liste wieder bei der ersten Portion: ohne
  // den Remount bliebe ein kurzes Ergebnis hinter einem aufgeklappten Stand.
  const filterKey = `${selectedShows.join(",")}|${selectedCities.join(",")}`;

  const changeView = useCallback(
    (next: View) => {
      setView(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "kalender") params.delete("view");
      else params.set("view", next);
      const query = params.toString();
      router.replace(`${window.location.pathname}${query ? `?${query}` : ""}#termine`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="termine-section" id="termine">
      <div className="section-head">
        <div>
          <div className="eyebrow">🎟️ Termine</div>
          <h2>Wann spielt welche Show wo?</h2>
        </div>
        <div className="view-toggle" role="tablist" aria-label="Ansicht wählen">
          <button
            type="button"
            role="tab"
            aria-selected={view === "kalender"}
            className={`chip${view === "kalender" ? " active" : ""}`}
            onClick={() => changeView("kalender")}
          >
            📅 Kalender
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "karte"}
            className={`chip${view === "karte" ? " active" : ""}`}
            onClick={() => changeView("karte")}
          >
            🗺️ Karte
          </button>
        </div>
      </div>

      <TermineFilterBar
        events={upcoming}
        shows={shows}
        selectedShows={selectedShows}
        selectedCities={selectedCities}
        onShowsChange={setSelectedShows}
        onCitiesChange={setSelectedCities}
        treffer={gefilterteUpcoming.length}
      />

      {view === "kalender" ? (
        <>
          <div className="public-calendar">
            <div className="calendar-legend">
              <span className="calendar-legend-label">Legende</span>
              <div className="eventbar" style={{ margin: 0 }}>
                {shows.map((s) => (
                  <span key={s.id} className="status" style={{ background: s.color, color: "#050711" }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <Calendar events={gefilterteEvents} initialYear={initialYear} initialMonth={initialMonth} />
          </div>
          <div className="termine-list-block">
            {/* Überschrift trennt die Monatsansicht oben von der Gesamtliste –
                auf Mobile stehen sonst zwei Terminlisten ohne Kontext hintereinander. */}
            <span className="map-section-label">Alle kommenden Termine</span>
            <EventGallery
              key={filterKey}
              events={gefilterteUpcoming}
              emptyText={
                selectedShows.length + selectedCities.length > 0
                  ? "Für diesen Filter ist nichts geplant — nimm oben eine Auswahl heraus."
                  : "Aktuell keine Termine geplant — Steffen arbeitet dran."
              }
            />
          </div>
        </>
      ) : (
        <NRWMap events={gefilterteUpcoming} venues={venues} shows={shows} />
      )}
    </div>
  );
}
