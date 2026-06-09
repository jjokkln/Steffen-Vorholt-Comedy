export type EventStatus = "archive" | "draft" | "live" | "missing";
export type EventColor = "green" | "ice" | "orange";

export interface ComedyEvent {
  title: string;
  show: string;
  slug: string;
  date: string;
  day: string;
  month: string;
  time: string;
  entry: string;
  city: string;
  location: string;
  provider: string;
  status: EventStatus;
  statusLabel: string;
  ticketUrl: string;
  color: EventColor;
}

export const EVENTS: ComedyEvent[] = [
  {
    title: "Brain Loading – Die Comedy-Improshow",
    show: "Brain Loading",
    slug: "brain-loading",
    date: "2026-02-12",
    day: "12",
    month: "Feb 2026",
    time: "20:00",
    entry: "19:00",
    city: "Oberhausen",
    location: "Druckluft",
    provider: "Eventbrite",
    status: "archive",
    statusLabel: "Archiv",
    ticketUrl:
      "https://www.eventbrite.de/e/brain-loading-die-comedy-improshow-in-oberhausen-tickets-1597741952189",
    color: "green",
  },
  {
    title: "Brain Loading – Die beste Impro-Comedyshow in NRW",
    show: "Brain Loading",
    slug: "brain-loading",
    date: "2026-04-09",
    day: "09",
    month: "Apr 2026",
    time: "20:00",
    entry: "19:00",
    city: "Neuss",
    location: "Further Str. 127",
    provider: "Rausgegangen",
    status: "archive",
    statusLabel: "Archiv",
    ticketUrl: "https://t.rausgegangen.de/tickets/brain-loading-63",
    color: "green",
  },
  {
    title: "Brain Loading – nächster Termin",
    show: "Brain Loading",
    slug: "brain-loading",
    date: "",
    day: "—",
    month: "Admin",
    time: "",
    entry: "",
    city: "Bochum / Dortmund / Düsseldorf / Essen / Köln",
    location: "Location wird gepflegt",
    provider: "Externer Ticketanbieter",
    status: "draft",
    statusLabel: "Termin pflegen",
    ticketUrl: "",
    color: "green",
  },
  {
    title: "Comedy Eiskalt – Open Mic",
    show: "Comedy Eiskalt",
    slug: "comedy-eiskalt",
    date: "",
    day: "—",
    month: "Admin",
    time: "20:00",
    entry: "",
    city: "Bergisch Gladbach",
    location: "Eissportarena Bergisch Gladbach",
    provider: "Externer Ticketanbieter",
    status: "draft",
    statusLabel: "Termin pflegen",
    ticketUrl: "",
    color: "ice",
  },
  {
    title: "Comedy Check-In – Dein Boarding",
    show: "Comedy Check-In",
    slug: "comedy-check-in",
    date: "",
    day: "—",
    month: "Admin",
    time: "",
    entry: "",
    city: "NRW",
    location: "wechselnde Location",
    provider: "Externer Ticketanbieter",
    status: "draft",
    statusLabel: "Termin pflegen",
    ticketUrl: "",
    color: "orange",
  },
];

export interface ShowMeta {
  slug: string;
  color: EventColor;
  label: string;
}

export const SHOW_META: Record<string, ShowMeta> = {
  "Brain Loading": { slug: "brain-loading", color: "green", label: "Impro-Comedy" },
  "Comedy Eiskalt": { slug: "comedy-eiskalt", color: "ice", label: "Open Mic" },
  "Comedy Check-In": { slug: "comedy-check-in", color: "orange", label: "Boarding-Show" },
};

export const SHOW_ORDER = ["Brain Loading", "Comedy Eiskalt", "Comedy Check-In"];

/** Where a ticket button should point: external ticket link, else the admin Termine page. */
export function targetForEvent(e: ComedyEvent): string {
  return e.ticketUrl || "/admin/termine";
}

/** Filter events to a single show, accepting either the show name or its slug. */
export function eventsForShow(show?: string): ComedyEvent[] {
  if (!show) return EVENTS;
  return EVENTS.filter((e) => e.show === show || e.slug === show);
}
