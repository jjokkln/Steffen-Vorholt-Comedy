import { formatDay, formatMonth, todayIso } from "@/lib/event-helpers";
import type { EventRow } from "@/lib/types";

export default function EventCard({ event }: { event: EventRow }) {
  const isPast = event.date < todayIso();
  const hasTicket = Boolean(event.ticket_url);
  const status = isPast
    ? { cls: "archive", label: "Vergangen" }
    : hasTicket
      ? { cls: "live", label: "Tickets verfügbar" }
      : { cls: "draft", label: "Tickets bald verfügbar" };

  return (
    <article className="card event-card">
      <div>
        <div className="event-top">
          <div>
            <h4>{event.shows?.name}</h4>
            <p>
              {event.city} · {event.venue}
            </p>
            <span className={`status ${status.cls}`}>{status.label}</span>
          </div>
          <div className="datebox" style={{ borderColor: event.shows?.color }}>
            <strong>{formatDay(event.date)}</strong>
            <span>{formatMonth(event.date)}</span>
          </div>
        </div>
      </div>
      <div>
        <p>
          {event.start_time ? `Showbeginn: ${event.start_time}` : "Uhrzeit folgt"}
          {event.entry_time ? ` · Einlass: ${event.entry_time}` : ""}
          {event.provider ? <><br />{event.provider}</> : null}
        </p>
        {hasTicket && !isPast ? (
          <a className="btn primary" href={event.ticket_url} target="_blank" rel="noreferrer">
            🎟 Tickets sichern
          </a>
        ) : (
          <a className="btn secondary" href={`/shows/${event.shows?.slug ?? ""}`}>
            Zur Show
          </a>
        )}
      </div>
    </article>
  );
}
