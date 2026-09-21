"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDateLong, todayIso } from "@/lib/event-helpers";
import type { EventRow, Show, Venue } from "@/lib/types";
import VenueEventsForm from "@/components/admin/VenueEventsForm";

/**
 * Die Orte-Ansicht. Ihr eigentlicher Zweck ist, einen Unterschied sichtbar zu
 * machen, den das Datenmodell macht und die Oberfläche bisher verschwieg:
 *
 * • **Gepflegter Standort** (`venues`) = ein Ort mit Koordinaten. Nur er kann
 *   einen Marker auf der NRW-Karte setzen.
 * • **Location am Termin** (`events.city` / `events.venue`) = Freitext. Steht
 *   im Ticket und in der Terminliste, weiß aber nichts von der Karte.
 *
 * Verbunden werden beide über `events.venue_id`. Fehlt der, hat der Termin eine
 * Location, aber keinen Standort — er ist auf der Website da, auf der Karte
 * nicht. Genau diese Termine stehen unten in einer eigenen Gruppe, mit einem
 * Knopf, der sie am passenden Ort anlegt.
 */

export default function VenueList({
  venues,
  events,
  shows,
}: {
  venues: Venue[];
  events: EventRow[];
  shows: Show[];
}) {
  const [offen, setOffen] = useState<string | null>(null);
  const [formFuer, setFormFuer] = useState<string | null>(null);
  const today = todayIso();

  const proOrt = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      if (!e.venue_id) continue;
      const list = map.get(e.venue_id) ?? [];
      list.push(e);
      map.set(e.venue_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.date.localeCompare(b.date));
    return map;
  }, [events]);

  const ohneStandort = useMemo(
    () => events.filter((e) => !e.venue_id).sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );

  return (
    <>
      <div className="hinweis-box">
        <p style={{ margin: 0 }}>
          <b>Standort oder Location?</b> Ein <b>Standort</b> ist ein Ort mit Koordinaten — nur er
          bekommt einen Marker auf der NRW-Karte, und du legst ihn im Reiter <b>Karte</b> an. Die{" "}
          <b>Location</b> am Termin ist bloß Text (Stadt + Saal) und erscheint auf der Website.
          Hängt an einem Termin kein Standort, fehlt er auf der Karte — unten siehst du, welche das
          sind.
        </p>
      </div>

      <table className="orte-tabelle">
        <thead>
          <tr><th>Standort</th><th>Termine</th><th>Nächster</th><th></th></tr>
        </thead>
        <tbody>
          {venues.map((v) => {
            const termine = proOrt.get(v.id) ?? [];
            const kommende = termine.filter((e) => e.date >= today);
            const auf = offen === v.id;
            return (
              <tr key={v.id} className={auf ? "offen" : undefined}>
                <td colSpan={4} style={{ padding: 0 }}>
                  <div className="ort-zeile">
                    <button
                      type="button"
                      className="ort-toggle"
                      aria-expanded={auf}
                      onClick={() => setOffen(auf ? null : v.id)}
                    >
                      <span aria-hidden="true">{auf ? "▾" : "▸"}</span>
                      <b>{v.city}</b>
                      <span style={{ color: "var(--muted)" }}>· {v.venue}</span>
                    </button>
                    <span className="ort-zahl">
                      {kommende.length} kommend
                      {termine.length !== kommende.length && ` · ${termine.length - kommende.length} vergangen`}
                    </span>
                    <span className="ort-naechster">
                      {kommende[0] ? formatDateLong(kommende[0].date) : <span style={{ color: "var(--muted)" }}>—</span>}
                    </span>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => { setFormFuer(formFuer === v.id ? null : v.id); setOffen(v.id); }}
                    >
                      {formFuer === v.id ? "Abbrechen" : "+ Termine hier anlegen"}
                    </button>
                  </div>
                  {auf && (
                    <div className="ort-inhalt">
                      {formFuer === v.id && (
                        <VenueEventsForm
                          venue={v}
                          shows={shows}
                          existing={termine}
                          onDone={() => setFormFuer(null)}
                        />
                      )}
                      {termine.length === 0 ? (
                        <p style={{ margin: 0 }}>An diesem Standort ist noch kein Termin angelegt.</p>
                      ) : (
                        <ul className="ort-termine">
                          {termine.map((e) => (
                            <li key={e.id}>
                              <span className={e.date < today ? "vergangen" : undefined}>
                                {formatDateLong(e.date)} · {e.shows?.name}
                              </span>
                              <span className={`status ${e.is_published ? "live" : "draft"}`}>
                                {e.is_published ? "Live" : "Entwurf"}
                              </span>
                              <Link className="btn secondary" href={`/admin/termine/${e.id}`}>Bearbeiten</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {venues.length === 0 && (
        <p>Noch kein Standort gepflegt — leg den ersten im Reiter <b>Karte</b> an.</p>
      )}

      {ohneStandort.length > 0 && (
        <div className="ohne-standort">
          <h3>⚠ {ohneStandort.length} Termin{ohneStandort.length === 1 ? "" : "e"} ohne gepflegten Standort</h3>
          <p>
            Diese Termine stehen auf der Website, erscheinen aber <b>nicht</b> auf der NRW-Karte.
            Lege den Ort im Reiter <b>Karte</b> an und wähle ihn dann im Termin aus.
          </p>
          <ul className="ort-termine">
            {ohneStandort.map((e) => (
              <li key={e.id}>
                <span className={e.date < today ? "vergangen" : undefined}>
                  {formatDateLong(e.date)} · {e.shows?.name} · {e.city}
                  {e.venue && ` · ${e.venue}`}
                </span>
                <Link className="btn secondary" href={`/admin/termine/${e.id}`}>Standort zuordnen</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
