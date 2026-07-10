import EventGallery from "@/components/EventGallery";
import { getPublishedEvents } from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";

export default async function EventGrid({
  showOnly,
  includePast = false,
  limit,
  showFilters = true,
}: {
  showOnly?: string;
  includePast?: boolean;
  limit?: number;
  showFilters?: boolean;
}) {
  const all = await getPublishedEvents();
  const filtered = showOnly ? all.filter((e) => e.shows?.name === showOnly) : all;
  const { upcoming, past } = partitionEvents(filtered);
  let items = includePast ? [...upcoming, ...past] : upcoming;
  if (limit) items = items.slice(0, limit);

  return <EventGallery events={items} showFilters={showFilters} />;
}
