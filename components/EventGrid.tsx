import EventCard from "@/components/EventCard";
import { eventsForShow } from "@/lib/events";

export default function EventGrid({ showOnly }: { showOnly?: string }) {
  const items = eventsForShow(showOnly);

  return (
    <div className="grid-3" data-events-grid>
      {items.length ? (
        items.map((event, i) => <EventCard key={`${event.slug}-${i}`} event={event} />)
      ) : (
        <div className="booking-empty">Noch keine Termine gepflegt.</div>
      )}
    </div>
  );
}
