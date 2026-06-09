import { eventsForShow, targetForEvent } from "@/lib/events";

export default function BookingList({ showOnly }: { showOnly?: string }) {
  const items = eventsForShow(showOnly);

  if (!items.length) {
    return (
      <div className="booking-list" data-booking-list>
        <div className="booking-empty">Noch keine Termine für diese Show gepflegt.</div>
      </div>
    );
  }

  return (
    <div className="booking-list" data-booking-list>
      {items.map((event, i) => {
        const url = targetForEvent(event);
        const isExternal = Boolean(event.ticketUrl);
        return (
          <article className="booking-row" key={`${event.slug}-${i}`}>
            <div className="booking-date">
              <strong>{event.day}</strong>
              <span>{event.month}</span>
            </div>
            <div>
              <h4>{event.title}</h4>
              <p>
                {event.show} · {event.city} · {event.location}
              </p>
              <span className={`status ${event.status}`}>{event.statusLabel}</span>
            </div>
            <a
              className="btn secondary"
              href={url}
              target={isExternal ? "_blank" : "_self"}
              rel="noreferrer"
            >
              {isExternal ? "Tickets" : "Pflegen"}
            </a>
          </article>
        );
      })}
    </div>
  );
}
