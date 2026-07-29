"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Calendar from "@/components/Calendar";
import TermineFilters from "@/components/TermineFilters";
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
            <Calendar events={events} initialYear={initialYear} initialMonth={initialMonth} />
          </div>
          <div style={{ marginTop: 28 }}>
            <TermineFilters events={upcoming} shows={shows} />
          </div>
        </>
      ) : (
        <NRWMap events={upcoming} venues={venues} shows={shows} />
      )}
    </div>
  );
}
