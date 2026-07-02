// Stilisierte NRW-Karte: Bounding-Box + Projektion lat/lng → viewBox (0..100).
// Bewusst vereinfacht („Galaxie-Karte"-Stil) – keine exakte Geometrie, aber
// Städte landen an ihrer ungefähren realen Position innerhalb von NRW.

const BOUNDS = { minLng: 5.8, maxLng: 9.6, minLat: 50.3, maxLat: 52.6 };

export function projectGeo(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

// Grobe NRW-Silhouette (im Uhrzeigersinn) als [lat, lng]-Stützpunkte.
const NRW_OUTLINE: [number, number][] = [
  [52.5, 7.0],
  [52.4, 8.9],
  [51.8, 9.4],
  [50.9, 8.5],
  [50.4, 7.2],
  [50.6, 6.0],
  [51.0, 6.0],
  [51.8, 6.0],
  [51.9, 6.7],
];

/** SVG-`points`-String der NRW-Silhouette für <polygon>. */
export const NRW_OUTLINE_POINTS = NRW_OUTLINE.map(([lat, lng]) => {
  const { x, y } = projectGeo(lat, lng);
  return `${x},${y}`;
}).join(" ");

// Bekannte NRW-Städte (lowercase key) → reale Koordinaten.
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  köln: { lat: 50.94, lng: 6.96 },
  koeln: { lat: 50.94, lng: 6.96 },
  düsseldorf: { lat: 51.23, lng: 6.78 },
  duesseldorf: { lat: 51.23, lng: 6.78 },
  neuss: { lat: 51.2, lng: 6.69 },
  essen: { lat: 51.46, lng: 7.01 },
  dortmund: { lat: 51.51, lng: 7.47 },
  bonn: { lat: 50.73, lng: 7.1 },
  aachen: { lat: 50.78, lng: 6.08 },
  münster: { lat: 51.96, lng: 7.63 },
  muenster: { lat: 51.96, lng: 7.63 },
  bielefeld: { lat: 52.02, lng: 8.53 },
  wuppertal: { lat: 51.26, lng: 7.18 },
  duisburg: { lat: 51.43, lng: 6.76 },
  bochum: { lat: 51.48, lng: 7.22 },
  mönchengladbach: { lat: 51.19, lng: 6.44 },
  moenchengladbach: { lat: 51.19, lng: 6.44 },
  krefeld: { lat: 51.33, lng: 6.56 },
  siegen: { lat: 50.88, lng: 8.02 },
  gelsenkirchen: { lat: 51.52, lng: 7.1 },
  wesel: { lat: 51.66, lng: 6.62 },
  hamm: { lat: 51.68, lng: 7.82 },
  hagen: { lat: 51.36, lng: 7.47 },
  leverkusen: { lat: 51.04, lng: 6.99 },
  paderborn: { lat: 51.72, lng: 8.75 },
  recklinghausen: { lat: 51.61, lng: 7.2 },
  oberhausen: { lat: 51.47, lng: 6.85 },
  solingen: { lat: 51.17, lng: 7.08 },
  remscheid: { lat: 51.18, lng: 7.19 },
  bottrop: { lat: 51.52, lng: 6.93 },
  herne: { lat: 51.54, lng: 7.22 },
};

/** Liefert Koordinaten für einen Stadtnamen – exakt oder per Teilstring-Match. */
export function coordsForCity(city: string): { lat: number; lng: number } | null {
  const key = city.trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(name)) return coords;
  }
  return null;
}
