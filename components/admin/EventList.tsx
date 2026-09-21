"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateLong, todayIso } from "@/lib/event-helpers";
import type { EventRow, Show, Venue } from "@/lib/types";
import DeleteButton from "@/components/admin/DeleteButton";

/**
 * Terminliste mit Filter, Sortierung und Deckel.
 *
 * Zwei Entscheidungen, die den Unterschied zum vorherigen Zustand ausmachen:
 *
 * 1. **Standardmäßig nur die nächsten fünf.** Alles auf einen Haufen zu kippen
 *    war die Beschwerde. Der Rest ist einen Klick entfernt, nicht weg — die
 *    Zahl im Knopf sagt, wie viele es sind.
 * 2. **„Ort" zeigt den gepflegten Standort, nicht den Freitext.** Ein Termin
 *    trägt `city`/`venue` als Text UND optional `venue_id` auf einen Standort
 *    der Karte. Hängt keiner dran, taucht er auf der NRW-Karte nicht auf —
 *    vorher sah man das nirgends, jetzt steht ⚠ in der Zeile.
 */

const PAGE = 5;

type Sort = "date-asc" | "date-desc" | "city" | "show";

export default function EventList({
  events,
  shows,
  venues,
  deleteAction,
}: {
  events: EventRow[];
  shows: Show[];
  venues: Venue[];
  deleteAction: (id: string, formData: FormData) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [showId, setShowId] = useState("");
  const [venueId, setVenueId] = useState("");
  const [status, setStatus] = useState("");
  const [zeitraum, setZeitraum] = useState<"kommende" | "vergangene" | "alle">("kommende");
  const [nurUnvollstaendig, setNurUnvollstaendig] = useState(false);
  const [sort, setSort] = useState<Sort>("date-asc");
  const [alle, setAlle] = useState(false);

  const venueById = useMemo(() => new Map(venues.map((v) => [v.id, v])), [venues]);
  const today = todayIso();

  const gefiltert = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = events.filter((e) => {
      if (zeitraum === "kommende" && e.date < today) return false;
      if (zeitraum === "vergangene" && e.date >= today) return false;
      if (showId && e.show_id !== showId) return false;
      if (venueId === "__ohne" ? e.venue_id : venueId && e.venue_id !== venueId) return false;
      if (status === "live" && !e.is_published) return false;
      if (status === "draft" && e.is_published) return false;
      if (nurUnvollstaendig && e.ticket_url && e.venue_id) return false;
      if (!needle) return true;
      return [e.city, e.venue, e.shows?.name, e.provider]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle));
    });
    const sorted = [...list];
    if (sort === "date-asc") sorted.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === "date-desc") sorted.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === "city") sorted.sort((a, b) => a.city.localeCompare(b.city, "de") || a.date.localeCompare(b.date));
    else sorted.sort((a, b) => (a.shows?.name ?? "").localeCompare(b.shows?.name ?? "", "de") || a.date.localeCompare(b.date));
    return sorted;
  }, [events, q, showId, venueId, status, zeitraum, nurUnvollstaendig, sort, today]);

  const sichtbar = alle ? gefiltert : gefiltert.slice(0, PAGE);
  const rest = gefiltert.length - sichtbar.length;
  const filterAktiv = Boolean(q || showId || venueId || status || nurUnvollstaendig) || zeitraum !== "kommende";

  function zuruecksetzen() {
    setQ(""); setShowId(""); setVenueId(""); setStatus("");
    setZeitraum("kommende"); setNurUnvollstaendig(false); setSort("date-asc"); setAlle(false);
  }

  return (
    <>
      <div className="admin-filterbar">
        <label className="admin-filterbar-search">
          <span className="sr-only">Termine durchsuchen</span>
          <input
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setAlle(false); }}
            placeholder="Suchen: Stadt, Location, Show…"
          />
        </label>
        <label>
          <span className="sr-only">Zeitraum</span>
          <select value={zeitraum} onChange={(e) => { setZeitraum(e.target.value as typeof zeitraum); setAlle(false); }}>
            <option value="kommende">Kommende</option>
            <option value="vergangene">Vergangene</option>
            <option value="alle">Alle</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Show</span>
          <select value={showId} onChange={(e) => { setShowId(e.target.value); setAlle(false); }}>
            <option value="">Alle Shows</option>
            {shows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Standort</span>
          <select value={venueId} onChange={(e) => { setVenueId(e.target.value); setAlle(false); }}>
            <option value="">Alle Orte</option>
            <option value="__ohne">⚠ Ohne gepflegten Standort</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.city} · {v.venue}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setAlle(false); }}>
            <option value="">Live &amp; Entwurf</option>
            <option value="live">Nur Live</option>
            <option value="draft">Nur Entwurf</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Sortierung</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="date-asc">Datum ↑</option>
            <option value="date-desc">Datum ↓</option>
            <option value="city">Stadt A–Z</option>
            <option value="show">Show A–Z</option>
          </select>
        </label>
        <label className="admin-filterbar-check">
          <input
            type="checkbox"
            checked={nurUnvollstaendig}
            onChange={(e) => { setNurUnvollstaendig(e.target.checked); setAlle(false); }}
          />
          Nur unvollständige
        </label>
        {filterAktiv && (
          <button type="button" className="btn secondary" onClick={zuruecksetzen}>
            Filter zurücksetzen
          </button>
        )}
      </div>

      <p className="admin-filter-result" role="status">
        {gefiltert.length === 0
          ? "Kein Termin passt zu diesen Filtern."
          : `${gefiltert.length} Termin${gefiltert.length === 1 ? "" : "e"}${alle || rest <= 0 ? "" : ` — die nächsten ${sichtbar.length} angezeigt`}`}
      </p>

      {sichtbar.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Datum</th><th>Show</th><th>Ort</th><th>Ticketlink</th><th>Status</th><th></th><th></th></tr>
            </thead>
            <tbody>
              {sichtbar.map((e) => {
                const v = e.venue_id ? venueById.get(e.venue_id) : null;
                return (
                  <tr key={e.id}>
                    <td>{formatDateLong(e.date)}</td>
                    <td>{e.shows?.name}</td>
                    <td>
                      {e.city}
                      {e.venue && <span style={{ color: "var(--muted)" }}> · {e.venue}</span>}
                      <br />
                      {v ? (
                        <span className="status live" title={`Auf der Karte: ${v.city} · ${v.venue}`}>Standort ✓</span>
                      ) : (
                        <span className="status missing" title="Ohne gepflegten Standort erscheint der Termin nicht auf der NRW-Karte.">
                          ⚠ kein Standort
                        </span>
                      )}
                    </td>
                    <td>{e.ticket_url ? "✓" : <span className="status missing">fehlt</span>}</td>
                    <td><span className={`status ${e.is_published ? "live" : "draft"}`}>{e.is_published ? "Live" : "Entwurf"}</span></td>
                    <td><Link className="btn secondary" href={`/admin/termine/${e.id}`}>Bearbeiten</Link></td>
                    <td>
                      <DeleteButton
                        action={deleteAction.bind(null, e.id)}
                        confirm={`Termin am ${formatDateLong(e.date)} in ${e.city} wirklich löschen?`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rest > 0 && (
        <button type="button" className="btn secondary" style={{ marginTop: 16 }} onClick={() => setAlle(true)}>
          ▸ {rest} weitere anzeigen
        </button>
      )}
      {alle && gefiltert.length > PAGE && (
        <button type="button" className="btn secondary" style={{ marginTop: 16 }} onClick={() => setAlle(false)}>
          ▴ Nur die nächsten {PAGE} zeigen
        </button>
      )}
    </>
  );
}
