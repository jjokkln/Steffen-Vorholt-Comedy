import EventCard from "@/components/EventCard";
import { getPublishedEvents } from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";

export default async function EventGrid({
  showOnly,
  includePast = false,
  limit,
}: {
  showOnly?: string;
  includePast?: boolean;
  limit?: number;
}) {
  const all = await getPublishedEvents();
  const filtered = showOnly ? all.filter((e) => e.shows?.name === showOnly) : all;
  const { upcoming, past } = partitionEvents(filtered);
  let items = includePast ? [...upcoming, ...past] : upcoming;
  if (limit) items = items.slice(0, limit);

  return (
    <div className="grid-3" data-events-grid>
      {items.length ? (
        items.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <div className="booking-empty">Keine Termine? Steffen schreibt gerade neue Witze. Schau bald wieder rein!</div>
      )}
    </div>
  );
}
