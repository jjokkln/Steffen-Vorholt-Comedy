"use client";

import { useActionState } from "react";
import type { EventRow, Show, Venue } from "@/lib/types";
import type { FormState } from "@/lib/actions/events";
import Toast from "@/components/admin/Toast";

export default function EventForm({
  event,
  shows,
  venues,
  action,
  lockedShowId,
}: {
  event?: EventRow;
  shows?: Show[];
  /** Gepflegte Spielorte — verknüpft den Termin mit einem Punkt auf der NRW-Karte. */
  venues?: Venue[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  // Wenn gesetzt, ist die Show fix vorgegeben (z. B. in den Show-Einstellungen):
  // kein Show-Select, sondern ein verstecktes Feld + einspaltiges Datumsfeld.
  lockedShowId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form className="card form" action={formAction}>
      {lockedShowId ? (
        <>
          <input type="hidden" name="show_id" value={lockedShowId} />
          <label>
            Datum *
            <input name="date" type="date" defaultValue={event?.date} required />
          </label>
        </>
      ) : (
        <div className="form two">
          <label>
            Show *
            <select name="show_id" defaultValue={event?.show_id} required>
              {(shows ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Datum *
            <input name="date" type="date" defaultValue={event?.date} required />
          </label>
        </div>
      )}
      <div className="form two">
        <label>
          Showbeginn (z. B. 20:00)
          <input name="start_time" defaultValue={event?.start_time} />
        </label>
        <label>
          Einlass (z. B. 19:00)
          <input name="entry_time" defaultValue={event?.entry_time} />
        </label>
      </div>
      <div className="form two">
        <label>
          Stadt *
          <input name="city" defaultValue={event?.city} required />
        </label>
        <label>
          Location / Venue
          <input name="venue" defaultValue={event?.venue} />
        </label>
      </div>
      {/* Ohne Spielort steht der Termin nicht auf der NRW-Karte — die Karte
          zeichnet Punkte aus `venues`, nicht mehr aus dem Stadtnamen. Neue Orte
          werden unter /admin/standorte per Klick in die Karte angelegt. */}
      <label>
        Spielort auf der Karte
        <select name="venue_id" defaultValue={event?.venue_id ?? ""}>
          <option value="">— nicht auf der Karte —</option>
          {(venues ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.city} · {v.venue}
            </option>
          ))}
        </select>
      </label>
      <div className="form two">
        <label>
          Ticketlink (extern)
          <input name="ticket_url" type="url" placeholder="https://..." defaultValue={event?.ticket_url} />
        </label>
        <label>
          Anbieter (z. B. Eventbrite)
          <input name="provider" defaultValue={event?.provider} />
        </label>
      </div>
      <label className="checkbox-row">
        <input name="is_published" type="checkbox" defaultChecked={event?.is_published ?? true} /> Veröffentlicht
      </label>
      <button className="btn primary" disabled={pending}>
        {pending ? "Speichert…" : event ? "Speichern" : "Termin anlegen"}
      </button>
      {state && !state.ok && <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>}
      {state?.ok && <Toast key={state.at} message={state.message} />}
    </form>
  );
}
