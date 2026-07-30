"use client";

import "leaflet/dist/leaflet.css";

import { useActionState, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import EventCard from "@/components/EventCard";
import VenueEventsForm from "@/components/admin/VenueEventsForm";
import { useCookieConsent } from "@/components/consent/CookieConsentProvider";
import { createVenue, deleteVenue, type FormState } from "@/lib/actions/venues";
import {
  NRW_BOUNDS,
  buildVenueMarkers,
  constellationLinks,
  roundCoord,
  type VenueMarker,
} from "@/lib/venue-helpers";
import type { EventRow, Show, Venue } from "@/lib/types";

type Mode = "besucher" | "admin";

const NRW = L.latLngBounds(NRW_BOUNDS[0], NRW_BOUNDS[1]);
const FIT_PADDING: L.PointTuple = [12, 12];

/**
 * Marker als divIcon statt Bild-Pin: Punkt in Show-Farbe, pulsierender Halo nur
 * bei Orten mit Termin, Ortsname als Label darunter. iconSize [0,0] +
 * position:absolute im Markup heißt: Leaflet setzt nur den Ankerpunkt, Größe und
 * Layout kommen komplett aus globals.css.
 */
function pinIcon(marker: VenueMarker, active: boolean): L.DivIcon {
  const count = marker.events.length;
  const size = count > 0 ? 15 : 11;
  const label = document.createElement("span");
  label.className = "pin-label";
  label.textContent = marker.venue.city;

  const pin = document.createElement("div");
  pin.className = `pin${active ? " is-active" : ""}`;
  pin.style.setProperty("--c", marker.color);
  pin.style.setProperty("--s", `${size}px`);
  if (count > 0) pin.appendChild(Object.assign(document.createElement("span"), { className: "pin-halo" }));
  pin.appendChild(Object.assign(document.createElement("span"), { className: "pin-dot" }));
  if (count > 1) {
    const badge = document.createElement("span");
    badge.className = "pin-count";
    badge.textContent = String(count);
    pin.appendChild(badge);
  }
  pin.appendChild(label);

  return L.divIcon({ className: "", iconSize: [0, 0], html: pin.outerHTML });
}

function draftIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html:
      '<div class="pin pin-draft" style="--c:#fff;--s:13px">' +
      '<span class="pin-halo"></span><span class="pin-dot"></span>' +
      '<span class="pin-label">Neuer Standort</span></div>',
  });
}

/** Fährt die Karte zum ausgewählten Ort bzw. auf den Gesamtausschnitt zurück. */
function MapCamera({ target, home }: { target: Venue | null; home: L.LatLngBounds }) {
  const map = useMap();
  const mounted = useRef(false);
  useEffect(() => {
    // Beim ersten Lauf nicht animieren: den Ausschnitt hat MapContainer schon
    // über `bounds` gesetzt, ein flyToBounds darüber ruckelt nur.
    if (!mounted.current) {
      mounted.current = true;
      if (!target) return;
    }
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 9), { duration: 0.7 });
    else map.flyToBounds(home, { padding: FIT_PADDING, duration: 0.7 });
  }, [map, target, home]);
  return null;
}

/**
 * Mausrad-Zoom erst nach einem Klick in die Karte: sonst kapert die Karte das
 * Seiten-Scrollen, sobald der Cursor beim Scrollen darüber wandert.
 */
function MapInteractions({ onPick }: { onPick: ((latlng: L.LatLng) => void) | null }) {
  const map = useMapEvents({
    click(event) {
      map.scrollWheelZoom.enable();
      onPick?.(event.latlng);
    },
    mouseout() {
      map.scrollWheelZoom.disable();
    },
  });
  // Der Container startet ggf. mit Breite 0 (Tab-Wechsel, Container-Query) –
  // ohne invalidateSize bleiben die Tiles dann grau.
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 120);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

export default function NRWMapClient({
  events,
  venues,
  shows = [],
  admin = false,
}: {
  events: EventRow[];
  venues: Venue[];
  shows?: Show[];
  admin?: boolean;
}) {
  const markers = useMemo(() => buildVenueMarkers(venues, events, shows), [venues, events, shows]);
  const links = useMemo(() => constellationLinks(venues), [venues]);

  // Im Admin startet der Pflegemodus – dafür ist die Seite da. Die Besucher-
  // Ansicht bleibt einen Klick entfernt als Vorschau.
  const [mode, setMode] = useState<Mode>(admin ? "admin" : "besucher");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState("");
  // Standort, dessen Termin-Formular gerade offen ist — immer nur eins, sonst
  // wird die Liste im schmalen Panel unlesbar.
  const [openVenue, setOpenVenue] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(createVenue, null);
  const lastSaved = useRef(0);

  // Nach dem Speichern Entwurf und Formular zurücksetzen – die neuen Daten
  // kommen über revalidatePath als frische Props herein.
  useEffect(() => {
    if (state?.ok && state.at !== lastSaved.current) {
      lastSaved.current = state.at;
      setDraft(null);
      setCity("");
    }
  }, [state]);

  const selectedMarker = markers.find((m) => m.venue.id === selected) ?? null;
  const shownEvents = selectedMarker ? selectedMarker.events : markers.flatMap((m) => m.events);
  const sortedEvents = [...shownEvents].sort((a, b) => a.date.localeCompare(b.date));

  const adminMode = admin && mode === "admin";

  /**
   * Einwilligungs-Gate für das Kartenmaterial (§ 25 TDDDG / Art. 6 DSGVO).
   *
   * Gegated wird **nur der `TileLayer`**, nicht die ganze Karte: Marker, Verbindungslinien,
   * Popups und im Admin das Klicken zum Anlegen laufen aus eigenen Daten und lösen keinen
   * Fremd-Request aus. Ohne Kartenbild bleiben die Pins also an ihrer geografischen Position
   * — auf dem dunklen Untergrund liest sich das wie eine Sternkarte und ist damit nicht
   * einmal ein Bruch im Design.
   *
   * `admin` umgeht das Gate bewusst: Dort ist der Betreiber selbst unterwegs, von dem keine
   * Einwilligung einzuholen ist. Vor allem aber wird der Banner auf `/admin` gar nicht
   * angezeigt (`UNBLOCKED_ROUTES` in CookieBanner.tsx) — die Einwilligung bliebe dort für
   * immer offen und die Pflege-Karte damit dauerhaft blind, obwohl man zum Anlegen eines
   * Standorts die Straßen sehen muss.
   */
  const { categories, save, hydrated } = useCookieConsent();
  const [tilesOnce, setTilesOnce] = useState(false);
  // Vor der Hydration ist der Consent unbekannt → nichts von OpenStreetMap laden.
  const tilesAllowed = admin || ((hydrated && categories?.externalMedia === true) || tilesOnce);

  /**
   * Startausschnitt: die Spielorte selbst, nicht ganz NRW. Alle Orte liegen an
   * der Rhein-Ruhr-Achse — auf ganz NRW gezoomt kleben die Punkte auf einem
   * Drittel der Fläche aufeinander, während Sauerland und Weserbergland leer
   * bleiben. Im Admin-Modus bleibt NRW, dort wird auch außerhalb geklickt.
   */
  const homeBounds = useMemo(() => {
    if (adminMode || markers.length < 2) return NRW;
    return L.latLngBounds(markers.map((m) => [m.venue.lat, m.venue.lng] as L.LatLngTuple)).pad(0.22);
  }, [adminMode, markers]);

  if (markers.length === 0 && !admin) {
    return (
      <div className="map-placeholder card">
        🗺️ Sobald Spielorte eingetragen sind, erscheinen sie hier auf der Karte.
      </div>
    );
  }

  return (
    <div className="nrw-map-layout">
      <div className="nrw-map-figure" data-mode={adminMode ? "admin" : "besucher"}>
        <div className="map-atlas-head">
          <span>Nordrhein-Westfalen · Spielorte</span>
          {admin && (
            <div className="mode-switch" role="group" aria-label="Modus">
              <button type="button" aria-pressed={mode === "besucher"} onClick={() => setMode("besucher")}>
                Besucher
              </button>
              <button type="button" aria-pressed={mode === "admin"} onClick={() => setMode("admin")}>
                Standorte pflegen
              </button>
            </div>
          )}
          <span className="map-atlas-live">Live</span>
        </div>

        <div className="nrw-map-canvas">
          <MapContainer
            bounds={homeBounds}
            boundsOptions={{ padding: FIT_PADDING }}
            maxBounds={NRW.pad(0.35)}
            maxBoundsViscosity={0.75}
            minZoom={6}
            maxZoom={15}
            zoomSnap={0.25}
            scrollWheelZoom={false}
            zoomControl={false}
          >
            {/* Attribution ist Lizenzbedingung von OpenStreetMap – nie entfernen.
                Erst nach Einwilligung eingehängt, siehe `tilesAllowed` oben. */}
            {tilesAllowed && (
              <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
                maxZoom={19}
                detectRetina
              />
            )}
            <ZoomControl position="bottomright" />
            <MapInteractions
              onPick={
                adminMode
                  ? (latlng) => setDraft({ lat: roundCoord(latlng.lat), lng: roundCoord(latlng.lng) })
                  : null
              }
            />
            <MapCamera target={selectedMarker?.venue ?? null} home={homeBounds} />

            {links.map(([a, b]) => (
              <Polyline
                key={`${a.id}~${b.id}`}
                positions={[
                  [a.lat, a.lng],
                  [b.lat, b.lng],
                ]}
                pathOptions={{
                  color: "#AEEBFF",
                  weight: 1,
                  opacity: 0.28,
                  dashArray: "3 7",
                  interactive: false,
                }}
              />
            ))}

            {markers.map((m) => (
              <Marker
                key={m.venue.id}
                position={[m.venue.lat, m.venue.lng]}
                icon={pinIcon(m, m.venue.id === selected)}
                title={`${m.venue.city} – ${m.venue.venue}`}
                riseOnHover
                eventHandlers={{ click: () => setSelected(m.venue.id) }}
              >
                <Popup>
                  <span className="pop-title">{m.venue.city}</span>
                  <span className="pop-meta">{m.venue.venue}</span>
                  <br />
                  <span className="pop-meta">
                    {m.events.length
                      ? `${m.events.length} ${m.events.length === 1 ? "Termin" : "Termine"}`
                      : "Termin folgt"}
                  </span>
                </Popup>
              </Marker>
            ))}

            {draft && <Marker position={[draft.lat, draft.lng]} icon={draftIcon()} interactive={false} />}
          </MapContainer>

          {/*
            Liegt bewusst NEBEN dem MapContainer, nicht darin: Leaflet verwaltet seinen
            Container selbst und würde fremde Kinder beim Neuzeichnen verlieren. Die Pins
            bleiben darunter sichtbar und bedienbar — deshalb ist das ein Hinweis am Rand
            und keine deckende Sperrfläche.
          */}
          {!tilesAllowed && (
            <div className="map-consent">
              <p className="map-consent-text">
                Das Kartenbild kommt von <strong>OpenStreetMap</strong>. Beim Laden wird deine
                IP-Adresse an die OpenStreetMap Foundation übertragen. Die Spielorte siehst du
                auch ohne Kartenbild — als Punkte hier und in der Liste darunter.
              </p>
              {/* `.yt-placeholder-*` bewusst geteilt: identische Optik wie die Embed-Gates
                  auf /galerie — ein Consent-Hinweis soll überall gleich aussehen. */}
              <div className="yt-placeholder-actions">
                <button
                  type="button"
                  className="yt-placeholder-btn"
                  onClick={() => setTilesOnce(true)}
                >
                  Kartenbild laden
                </button>
                <button
                  type="button"
                  className="yt-placeholder-btn"
                  onClick={() => save({ externalMedia: true })}
                >
                  Externe Medien immer erlauben
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="nrw-map-panel">
        {adminMode ? (
          <div className="map-admin">
            <div className="map-admin-hint">
              <span aria-hidden="true">📍</span>
              <span>
                <b>Klick in die Karte</b>, wo der neue Spielort liegt — dann Namen und Show eintragen
                und speichern. Der Ort erscheint sofort für Besucher. Termine legst du unten direkt am
                Ort an: <b>„+ Termine"</b> nimmt beliebig viele Daten auf einmal.
              </span>
            </div>

            <span className="map-section-label">Neuer Standort</span>
            <form className="map-admin-form" action={formAction}>
              <div className="map-coords">
                {draft
                  ? `${draft.lat.toFixed(4)} N, ${draft.lng.toFixed(4)} E`
                  : "Noch kein Punkt gesetzt — bitte in die Karte klicken."}
              </div>
              <input type="hidden" name="lat" value={draft?.lat ?? ""} />
              <input type="hidden" name="lng" value={draft?.lng ?? ""} />
              <label>
                <span>Ort</span>
                <input
                  name="city"
                  placeholder="z. B. Bochum"
                  autoComplete="off"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
              <label>
                <span>Location</span>
                <input name="venue" placeholder="z. B. Bahnhof Langendreer" autoComplete="off" />
              </label>
              <label>
                <span>Show</span>
                <select name="show_id" defaultValue="">
                  <option value="">Keine Zuordnung</option>
                  {shows.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="actions" style={{ marginTop: 4 }}>
                {/* pending mit sperren: ohne das legt ein Doppelklick den Ort
                    zweimal an – der Insert braucht einen Roundtrip, und in der
                    Zeit ist der Button sonst weiter klickbar. */}
                <button className="btn primary" disabled={pending || !draft || !city.trim()}>
                  {pending ? "Speichert…" : "Standort speichern"}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={pending || (!draft && !city)}
                  onClick={() => {
                    setDraft(null);
                    setCity("");
                  }}
                >
                  Abbrechen
                </button>
              </div>
              {state && (
                <p className={state.ok ? "map-admin-ok" : "map-admin-err"} role="status">
                  {state.message}
                </p>
              )}
            </form>

            <span className="map-section-label">Gepflegte Standorte</span>
            <div className="loc-table">
              {markers.length === 0 && (
                <p className="map-admin-empty">Noch kein Standort angelegt.</p>
              )}
              {markers.map((m) => (
                <div className="loc-item" key={m.venue.id} style={{ "--c": m.color } as CSSProperties}>
                  <div className="loc-row">
                    <span className="chip-dot" />
                    <div className="loc-name">
                      <strong>
                        {m.venue.city} · {m.venue.venue}
                      </strong>
                      <span>
                        {m.venue.lat.toFixed(3)} N, {m.venue.lng.toFixed(3)} E
                      </span>
                    </div>
                    <span className="loc-badge">
                      {m.events.length
                        ? `${m.events.length} ${m.events.length === 1 ? "Termin" : "Termine"}`
                        : "kein Termin"}
                    </span>
                    {/* Termine hängen sonst nur über das Select im Termin-Formular
                        am Ort — für eine Reihe gleicher Abende war das ein
                        Formular pro Datum. */}
                    <button
                      type="button"
                      className="loc-add"
                      aria-expanded={openVenue === m.venue.id}
                      onClick={() => setOpenVenue((prev) => (prev === m.venue.id ? null : m.venue.id))}
                    >
                      {openVenue === m.venue.id ? "Schließen" : "+ Termine"}
                    </button>
                    {/* Orte mit Terminen bleiben stehen – die Server Action lehnt
                        das Löschen ohnehin ab, hier wird es nur nicht angeboten.
                        Eigenes <form>, deshalb außerhalb des Termin-Formulars. */}
                    <form
                      action={deleteVenue.bind(null, m.venue.id)}
                      onSubmit={(event) => {
                        if (!window.confirm(`Standort „${m.venue.city}" wirklich löschen?`)) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <button
                        className="loc-delete"
                        disabled={m.events.length > 0}
                        title={
                          m.events.length
                            ? "An diesem Ort hängen Termine – erst die Termine umziehen"
                            : "Standort löschen"
                        }
                        aria-label={`Standort ${m.venue.city} löschen`}
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                  {openVenue === m.venue.id && (
                    <VenueEventsForm
                      venue={m.venue}
                      shows={shows}
                      existing={m.events}
                      onDone={() => setOpenVenue(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="map-city-rail" data-filters aria-label="Ort wählen">
              <button
                type="button"
                className={`chip${selected === null ? " active" : ""}`}
                onClick={() => setSelected(null)}
              >
                Alle Orte
              </button>
              {markers.map((m) => (
                <button
                  key={m.venue.id}
                  type="button"
                  className={`chip${m.venue.id === selected ? " active" : ""}`}
                  style={{ "--c": m.color } as CSSProperties}
                  onClick={() => setSelected(m.venue.id)}
                >
                  <span className="chip-dot" />
                  {m.venue.city}
                </button>
              ))}
            </div>

            <div className="map-results-head">
              <div>
                <span className="map-results-eyebrow">
                  {selectedMarker ? selectedMarker.venue.venue : `${markers.length} Spielorte`}
                </span>
                <h3>{selectedMarker ? selectedMarker.venue.city : "Nordrhein-Westfalen"}</h3>
              </div>
              <span className="map-results-count">
                {sortedEvents.length} {sortedEvents.length === 1 ? "Termin" : "Termine"}
              </span>
            </div>

            {sortedEvents.length > 0 ? (
              <div className="map-events-grid" data-events-grid>
                {sortedEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <div className="booking-empty map-empty">
                {selectedMarker
                  ? `Für ${selectedMarker.venue.city} ist gerade kein Termin geplant.`
                  : "Gerade keine Termine geplant."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
