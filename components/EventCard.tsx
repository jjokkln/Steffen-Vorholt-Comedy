import { type ComedyEvent, targetForEvent } from "@/lib/events";

export default function EventCard({ event }: { event: ComedyEvent }) {
  const url = targetForEvent(event);
  const isExternal = Boolean(event.ticketUrl);

  return (
    <article className="card event-card" data-show={event.show} data-city={event.city}>
      <div>
        <div className="event-top">
          <div>
            <h4>{event.title}</h4>
            <p>
              {event.show}
              <br />
              {event.city} · {event.location}
            </p>
            <span className={`status ${event.status}`}>{event.statusLabel}</span>
          </div>
          <div className="datebox">
            <strong>{event.day}</strong>
            <span>{event.month}</span>
          </div>
        </div>
      </div>
      <div>
        <p>
          {event.time ? `Showbeginn: ${event.time}` : "Uhrzeit wird gepflegt"}
          {event.entry ? ` · Einlass: ${event.entry}` : ""}
          <br />
          {event.provider}
        </p>
        <a
          className="btn secondary"
          href={url}
          target={isExternal ? "_blank" : "_self"}
          rel="noreferrer"
        >
          {isExternal ? "Ticketlink öffnen" : "Im Admin pflegen"}
        </a>
      </div>
    </article>
  );
}
