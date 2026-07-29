import type { EventRow, Show, Venue } from "@/lib/types";

/** Bounding-Box von NRW – Startausschnitt und maxBounds der Leaflet-Karte. */
export const NRW_BOUNDS: [[number, number], [number, number]] = [
  [50.29, 5.83],
  [52.55, 9.5],
];

/** Fallback-Farbe für Orte ohne Show-Zuordnung und ohne Termin (--ice). */
export const VENUE_FALLBACK_COLOR = "#AEEBFF";

export interface VenueMarker {
  venue: Venue;
  /** Termine an diesem Ort, aufsteigend nach Datum. */
  events: EventRow[];
  color: string;
}

/**
 * Bündelt Orte mit ihren Terminen und löst die Markerfarbe auf.
 *
 * Reihenfolge der Farbquellen: die Show, der der Ort zugeordnet ist → die Show
 * des nächsten Termins dort → Fallback. Ein neu angelegter Ort hat noch keine
 * Termine, deshalb kommt die Zuordnung zuerst.
 */
export function buildVenueMarkers(
  venues: Venue[],
  events: EventRow[],
  shows: Show[] = [],
): VenueMarker[] {
  const colorByShowId = new Map(shows.map((s) => [s.id, s.color]));
  const byVenue = new Map<string, EventRow[]>();
  for (const event of events) {
    if (!event.venue_id) continue;
    const list = byVenue.get(event.venue_id);
    if (list) list.push(event);
    else byVenue.set(event.venue_id, [event]);
  }

  return venues
    .map((venue) => {
      const venueEvents = (byVenue.get(venue.id) ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
      const color =
        (venue.show_id ? colorByShowId.get(venue.show_id) : undefined) ??
        venueEvents[0]?.shows?.color ??
        VENUE_FALLBACK_COLOR;
      return { venue, events: venueEvents, color };
    })
    .sort((a, b) => a.venue.city.localeCompare(b.venue.city, "de"));
}

/**
 * „Sternbild"-Linien: jeder Ort verbindet sich mit seinem nächsten Nachbarn.
 *
 * Doppelte Kanten werden entfernt – bei zwei Orten, die sich gegenseitig am
 * nächsten liegen, läge die Linie sonst zweimal übereinander und wäre doppelt
 * so dunkel wie alle anderen.
 */
export function constellationLinks(venues: Venue[]): Array<[Venue, Venue]> {
  if (venues.length < 2) return [];
  const seen = new Set<string>();
  const links: Array<[Venue, Venue]> = [];

  for (const from of venues) {
    let nearest: Venue | null = null;
    let nearestDist = Infinity;
    for (const to of venues) {
      if (to === from) continue;
      const d = (from.lat - to.lat) ** 2 + (from.lng - to.lng) ** 2;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = to;
      }
    }
    if (!nearest) continue;
    const key = [from.id, nearest.id].sort().join("~");
    if (seen.has(key)) continue;
    seen.add(key);
    links.push([from, nearest]);
  }

  return links;
}

/** Koordinate auf 4 Dezimalen – reicht auf ~11 m genau und hält die DB sauber. */
export function roundCoord(value: number): number {
  return Math.round(value * 1e4) / 1e4;
}

/** Prüft, ob eine Koordinate plausibel innerhalb der NRW-Box liegt. */
export function isInNrw(lat: number, lng: number): boolean {
  const [[minLat, minLng], [maxLat, maxLng]] = NRW_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
