const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";

export function personJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Steffen Vorholt",
    jobTitle: "Comedian",
    url: SITE,
    description: "Comedian, Moderator und Veranstalter aus Neuss – Host von Brain Loading, Comedy Eiskalt und Comedy Check-In.",
  };
}

export function comedyEventJsonLd(e: {
  date: string;
  start_time: string;
  city: string;
  venue: string;
  ticket_url: string;
  showName: string;
  slug: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ComedyEvent",
    name: `${e.showName} – ${e.city}`,
    startDate: e.start_time ? `${e.date}T${e.start_time}:00` : e.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: e.venue || e.city,
      address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: "DE" },
    },
    performer: { "@type": "Person", name: "Steffen Vorholt" },
    organizer: { "@type": "Person", name: "Steffen Vorholt", url: SITE },
    url: `${SITE}/shows/${e.slug}`,
    ...(e.ticket_url
      ? { offers: { "@type": "Offer", url: e.ticket_url, availability: "https://schema.org/InStock", priceCurrency: "EUR" } }
      : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE}${item.path}`,
    })),
  };
}

/** EventRow + Join → Builder-Input. */
export function eventToJsonLdInput(e: {
  date: string; start_time: string; city: string; venue: string; ticket_url: string;
  shows?: { name: string; slug: string } | null;
}) {
  return {
    date: e.date, start_time: e.start_time, city: e.city, venue: e.venue,
    ticket_url: e.ticket_url, showName: e.shows?.name ?? "", slug: e.shows?.slug ?? "",
  };
}
