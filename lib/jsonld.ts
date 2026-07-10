const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://steffenvorholt.de";
const INSTAGRAM = "https://www.instagram.com/steffen_vorholt";
const LOGO = `${SITE}/assets/media/brand/logo_steffen.png`;

export function personJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Steffen Vorholt",
    jobTitle: "Comedian",
    url: SITE,
    image: `${SITE}/assets/media/steffen/steffen-hero-cutout.png`,
    description: "Comedian, Moderator und Veranstalter aus Recklinghausen – Host von Brain Loading, Comedy Eiskalt und Comedy Check-In.",
    sameAs: [INSTAGRAM],
  };
}

/** Site-weite Marken-Entität (Logo → Google-Knowledge-Panel / Logo in der Suche). */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Steffen Vorholt",
    alternateName: "Steffens Comedy Universum",
    url: SITE,
    logo: LOGO,
    description: "Live-Comedy aus NRW: Impro, Open Mic & Boarding-Comedy mit Steffen Vorholt.",
    sameAs: [INSTAGRAM],
  };
}

/** WebSite-Entität – hilft Google, den offiziellen Seitennamen zu erkennen. */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Steffen Vorholt",
    url: SITE,
    inLanguage: "de-DE",
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
