"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import { NRW_OUTLINE_POINTS, coordsForCity, projectGeo } from "@/lib/nrw-geo";
import type { EventRow } from "@/lib/types";

interface CityMarker {
  city: string;
  events: EventRow[];
  color: string;
  pos: { x: number; y: number } | null;
}

// Kreis-Radius eines Markers (inkl. Halo) – Städte mit mehr Terminen bekommen
// einen größeren Kreis, gedeckelt bei 5 Terminen.
function markerRadius(eventCount: number): number {
  return 1.8 + Math.min(eventCount, 5) * 0.45;
}

// Manche NRW-Städte liegen geografisch so eng beieinander (z. B. Essen/
// Oberhausen, Düsseldorf/Leverkusen), dass ihre Kreise + Namens-Labels sich
// auf der stilisierten Karte überlappen würden. Die Karte ist laut nrw-geo.ts
// ohnehin nur eine Näherung („ungefähre reale Position"), daher dürfen wir die
// Positionen minimal auseinanderschieben – reine Kräfte-Relaxation, bis sich
// keine zwei Kreise (+ Platz fürs Label) mehr berühren.
function resolveMarkerOverlap(points: { pos: { x: number; y: number }; r: number }[]) {
  const LABEL_MARGIN = 3.2;
  for (let iter = 0; iter < 200; iter += 1) {
    let moved = false;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const minDist = a.r + b.r + LABEL_MARGIN;
        let dx = b.pos.x - a.pos.x;
        let dy = b.pos.y - a.pos.y;
        let dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          if (dist === 0) {
            const angle = (j / points.length) * Math.PI * 2;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 1;
          }
          const push = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          a.pos.x -= ux * push;
          a.pos.y -= uy * push;
          b.pos.x += ux * push;
          b.pos.y += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
}

export default function NRWMap({ events }: { events: EventRow[] }) {
  const markers = useMemo<CityMarker[]>(() => {
    const byCity = new Map<string, EventRow[]>();
    for (const e of events) {
      const city = e.city?.trim();
      if (!city) continue;
      byCity.set(city, [...(byCity.get(city) ?? []), e]);
    }
    const built = [...byCity.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([city, evs]) => {
        const coords = coordsForCity(city);
        return {
          city,
          events: evs,
          color: evs[0]?.shows?.color ?? "#7CFF6B",
          pos: coords ? projectGeo(coords.lat, coords.lng) : null,
        };
      });
    resolveMarkerOverlap(
      built
        .filter((m): m is typeof m & { pos: { x: number; y: number } } => m.pos !== null)
        .map((m) => ({ pos: m.pos, r: markerRadius(m.events.length) })),
    );
    return built;
  }, [events]);

  const [selected, setSelected] = useState<string | null>(markers[0]?.city ?? null);
  const [expanded, setExpanded] = useState(false);
  const selectedMarker = markers.find((m) => m.city === selected) ?? null;
  const selectCity = (city: string) => {
    setSelected(city);
    setExpanded(false);
  };

  // Sternbild-Linien: minimaler Spannbaum über die Städte-Positionen, statt
  // einer festen Namensliste – funktioniert für jede Kombination an Städten,
  // die gerade Termine haben (nicht nur die 6 Beispielstädte aus dem Handoff).
  const constellation = useMemo(() => {
    const points = markers.filter((m) => m.pos);
    if (points.length < 2) return [];
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const inTree = new Set([0]);
    const edges: Array<{ a: (typeof points)[number]; b: (typeof points)[number] }> = [];
    while (inTree.size < points.length) {
      let best: { from: number; to: number; d: number } | null = null;
      for (const from of inTree) {
        for (let to = 0; to < points.length; to += 1) {
          if (inTree.has(to)) continue;
          const d = dist(points[from].pos!, points[to].pos!);
          if (!best || d < best.d) best = { from, to, d };
        }
      }
      if (!best) break;
      edges.push({ a: points[best.from], b: points[best.to] });
      inTree.add(best.to);
    }
    return edges;
  }, [markers]);

  if (markers.length === 0) {
    return (
      <div className="map-placeholder card">
        🗺️ Sobald Termine eingetragen sind, erscheinen hier die Städte.
      </div>
    );
  }

  return (
    <div className="nrw-map-layout">
      <div className="nrw-map-figure">
        <svg viewBox="0 0 100 100" className="nrw-map-svg" role="img" aria-label="Karte von NRW mit Spielorten">
          <defs>
            <radialGradient id="nrw-glow" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="rgba(124,255,107,.12)" />
              <stop offset="100%" stopColor="rgba(5,7,17,0)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="url(#nrw-glow)" />
          <polygon
            points={NRW_OUTLINE_POINTS}
            fill="rgba(255,255,255,.04)"
            stroke="rgba(255,255,255,.22)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          <g className="nrw-constellation" stroke="rgba(124,255,107,.4)" strokeWidth="0.35" strokeDasharray="1.6 2.2" fill="none">
            {constellation.map(({ a, b }) => (
              <line key={`${a.city}-${b.city}`} x1={a.pos!.x} y1={a.pos!.y} x2={b.pos!.x} y2={b.pos!.y} />
            ))}
          </g>
          {markers
            .filter((m) => m.pos)
            .map((m) => {
              const { x, y } = m.pos!;
              const active = m.city === selected;
              const r = markerRadius(m.events.length);
              return (
                <g
                  key={m.city}
                  className={`nrw-marker${active ? " active" : ""}`}
                  transform={`translate(${x} ${y})`}
                  onClick={() => selectCity(m.city)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${m.city} – ${m.events.length} Termin(e)`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectCity(m.city);
                    }
                  }}
                >
                  <circle className="nrw-marker-halo" r={r + 1.6} fill="none" stroke={m.color} strokeWidth="0.5" />
                  {active && <circle r={r + 2.4} fill="none" stroke={m.color} strokeWidth="0.5" opacity="0.6" />}
                  <circle r={r} fill={m.color} stroke="#050711" strokeWidth="0.4" />
                  <text x="0" y={r + 3.4} textAnchor="middle" className="nrw-marker-label">
                    {m.city}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      <div className="nrw-map-panel">
        <div className="filters" data-filters>
          {markers.map((m) => (
            <button
              key={m.city}
              type="button"
              className={`chip${m.city === selected ? " active" : ""}`}
              onClick={() => selectCity(m.city)}
            >
              {m.city} ({m.events.length})
            </button>
          ))}
        </div>
        {selectedMarker ? (
          <>
            <div className="map-events-grid" data-events-grid style={{ marginTop: 18 }}>
              {(expanded ? selectedMarker.events : selectedMarker.events.slice(0, 2)).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
            {selectedMarker.events.length > 2 && (
              <button
                type="button"
                className="chip"
                style={{ marginTop: 14 }}
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Weniger anzeigen" : `Alle ${selectedMarker.events.length} Termine anzeigen`}
              </button>
            )}
          </>
        ) : (
          <div className="booking-empty">Wähle eine Stadt, um die Termine zu sehen.</div>
        )}
      </div>
    </div>
  );
}
