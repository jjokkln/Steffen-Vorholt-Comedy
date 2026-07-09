"use client";

import EventGallery from "@/components/EventGallery";
import type { EventRow, Show } from "@/lib/types";

export default function TermineFilters({ events }: { events: EventRow[]; shows: Show[] }) {
  return <EventGallery events={events} />;
}
