import type { EventRow, Show } from "@/lib/types";

export default function EventForm({
  event,
  shows,
  action,
}: {
  event?: EventRow;
  shows: Show[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form className="card form" action={action}>
      <div className="form two">
        <label>
          Show *
          <select name="show_id" defaultValue={event?.show_id} required>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          Datum *
          <input name="date" type="date" defaultValue={event?.date} required />
        </label>
      </div>
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
      <label style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <input name="is_published" type="checkbox" defaultChecked={event?.is_published ?? true} /> Veröffentlicht
      </label>
      <button className="btn primary">{event ? "Speichern" : "Termin anlegen"}</button>
    </form>
  );
}
