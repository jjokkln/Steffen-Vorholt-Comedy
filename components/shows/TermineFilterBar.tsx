"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import type { EventRow, Show } from "@/lib/types";

/**
 * Orte, die immer offen als Pille stehen (Steffen, 21.09.2026) — sein Kernrevier.
 * Reihenfolge = Anzeigereihenfolge. Alles andere liegt im Dropdown, ist dort aber
 * über die Suche erreichbar. Ein Ort, der hier steht aber keinen Termin hat,
 * erscheint NICHT: eine Pille ohne Treffer ist eine Sackgasse.
 */
const KERN_ORTE = ["Neuss", "Dormagen", "Leverkusen", "Köln"];

/** So viele Show-Pillen stehen offen; ab der vierten Show wandert der Rest ins Dropdown. */
const SICHTBARE_SHOWS = 3;

export type Option = { value: string; label: string; count: number; color?: string };

export default function TermineFilterBar({
  events,
  shows,
  selectedShows,
  selectedCities,
  onShowsChange,
  onCitiesChange,
  treffer,
}: {
  /** Ungefilterte Grundmenge — sonst verschwänden Optionen, sobald man eine wählt. */
  events: EventRow[];
  shows: Show[];
  selectedShows: string[];
  selectedCities: string[];
  onShowsChange: (next: string[]) => void;
  onCitiesChange: (next: string[]) => void;
  /** Anzahl der Termine, die der aktuelle Filter übrig lässt. */
  treffer: number;
}) {
  const { showOptionen, ortOptionen } = useMemo(() => {
    const showAnzahl = new Map<string, number>();
    const ortAnzahl = new Map<string, number>();
    for (const e of events) {
      const slug = e.shows?.slug;
      if (slug) showAnzahl.set(slug, (showAnzahl.get(slug) ?? 0) + 1);
      if (e.city) ortAnzahl.set(e.city, (ortAnzahl.get(e.city) ?? 0) + 1);
    }
    const showOptionen: Option[] = shows
      .filter((s) => showAnzahl.has(s.slug))
      .map((s) => ({ value: s.slug, label: s.name, count: showAnzahl.get(s.slug) ?? 0, color: s.color }));
    // Kernorte zuerst (in ihrer festen Reihenfolge), danach alles Weitere alphabetisch.
    const uebrig = [...ortAnzahl.keys()]
      .filter((c) => !KERN_ORTE.includes(c))
      .sort((a, b) => a.localeCompare(b, "de"));
    const ortOptionen: Option[] = [...KERN_ORTE.filter((c) => ortAnzahl.has(c)), ...uebrig].map((c) => ({
      value: c,
      label: c,
      count: ortAnzahl.get(c) ?? 0,
    }));
    return { showOptionen, ortOptionen };
  }, [events, shows]);

  const offeneShows = showOptionen.slice(0, SICHTBARE_SHOWS);
  const showsImKlapper = showOptionen.slice(SICHTBARE_SHOWS);
  // Eine gewählte Show aus dem Dropdown gehört sichtbar in die Zeile — sonst
  // filtert die Seite nach etwas, das man nirgends stehen sieht.
  const zusatzShows = showsImKlapper.filter((o) => selectedShows.includes(o.value));

  const kernOrte = ortOptionen.filter((o) => KERN_ORTE.includes(o.value));
  const zusatzOrte = ortOptionen.filter((o) => !KERN_ORTE.includes(o.value) && selectedCities.includes(o.value));
  const orteImKlapper = ortOptionen.filter((o) => !KERN_ORTE.includes(o.value));

  const umschalten = (wert: string, aktuell: string[], setzen: (next: string[]) => void) =>
    setzen(aktuell.includes(wert) ? aktuell.filter((v) => v !== wert) : [...aktuell, wert]);

  const aktiv = selectedShows.length + selectedCities.length;

  return (
    <div className="termine-filterbar">
      <div className="filterbar-head">
        <span className="filterbar-title">Filter</span>
        <span className="filterbar-treffer" aria-live="polite">
          {treffer} {treffer === 1 ? "Termin" : "Termine"}
        </span>
        {aktiv > 0 && (
          <button
            type="button"
            className="filterbar-reset"
            onClick={() => {
              onShowsChange([]);
              onCitiesChange([]);
            }}
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      <FilterZeile
        label="Show"
        alleLabel="Alle Shows"
        offen={[...offeneShows, ...zusatzShows]}
        imKlapper={showsImKlapper}
        ausgewaehlt={selectedShows}
        onToggle={(v) => umschalten(v, selectedShows, onShowsChange)}
        onReset={() => onShowsChange([])}
        suchePlatzhalter="Show suchen …"
      />

      <FilterZeile
        label="Ort"
        alleLabel="Alle Orte"
        offen={[...kernOrte, ...zusatzOrte]}
        imKlapper={orteImKlapper}
        ausgewaehlt={selectedCities}
        onToggle={(v) => umschalten(v, selectedCities, onCitiesChange)}
        onReset={() => onCitiesChange([])}
        suchePlatzhalter="Ort suchen …"
      />
    </div>
  );
}

function FilterZeile({
  label,
  alleLabel,
  offen,
  imKlapper,
  ausgewaehlt,
  onToggle,
  onReset,
  suchePlatzhalter,
}: {
  label: string;
  alleLabel: string;
  offen: Option[];
  imKlapper: Option[];
  ausgewaehlt: string[];
  onToggle: (wert: string) => void;
  onReset: () => void;
  suchePlatzhalter: string;
}) {
  if (offen.length === 0 && imKlapper.length === 0) return null;
  const versteckteGewaehlt = imKlapper.filter((o) => ausgewaehlt.includes(o.value)).length;

  return (
    <div className="filter-zeile">
      <span className="filter-zeile-label">{label}</span>
      <div className="filter-zeile-pillen" role="group" aria-label={`${label} filtern`}>
        <button
          type="button"
          className={`chip filter-pille${ausgewaehlt.length === 0 ? " active" : ""}`}
          aria-pressed={ausgewaehlt.length === 0}
          onClick={onReset}
        >
          {alleLabel}
        </button>
        {offen.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`chip filter-pille${ausgewaehlt.includes(o.value) ? " active" : ""}`}
            aria-pressed={ausgewaehlt.includes(o.value)}
            onClick={() => onToggle(o.value)}
          >
            {o.color && <span className="chip-dot" style={{ "--c": o.color } as CSSProperties} aria-hidden="true" />}
            {o.label}
            <span className="filter-pille-zahl">{o.count}</span>
          </button>
        ))}
        {imKlapper.length > 0 && (
          <FilterKlapper
            label={label}
            optionen={imKlapper}
            ausgewaehlt={ausgewaehlt}
            onToggle={onToggle}
            suchePlatzhalter={suchePlatzhalter}
            versteckteGewaehlt={versteckteGewaehlt}
          />
        )}
      </div>
    </div>
  );
}

/**
 * „Mehr anzeigen" als eigenes Auswahlfeld statt einer Pillenflut: Suchfeld oben,
 * darunter eine scrollbare Liste echter Checkboxen. Echte Checkboxen, weil ein
 * `role="option"`-Nachbau Mehrfachauswahl per Tastatur selbst verdrahten müsste —
 * hier erledigen das Tab und Leertaste ohne eine Zeile Code.
 */
function FilterKlapper({
  label,
  optionen,
  ausgewaehlt,
  onToggle,
  suchePlatzhalter,
  versteckteGewaehlt,
}: {
  label: string;
  optionen: Option[];
  ausgewaehlt: string[];
  onToggle: (wert: string) => void;
  suchePlatzhalter: string;
  versteckteGewaehlt: number;
}) {
  const [offen, setOffen] = useState(false);
  const [suche, setSuche] = useState("");
  const wurzel = useRef<HTMLDivElement>(null);
  const knopf = useRef<HTMLButtonElement>(null);
  const feld = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const sucheId = useId();

  useEffect(() => {
    if (!offen) return;
    feld.current?.focus();
    const beiKlick = (e: PointerEvent) => {
      if (!wurzel.current?.contains(e.target as Node)) setOffen(false);
    };
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOffen(false);
      knopf.current?.focus();
    };
    document.addEventListener("pointerdown", beiKlick);
    document.addEventListener("keydown", beiTaste);
    return () => {
      document.removeEventListener("pointerdown", beiKlick);
      document.removeEventListener("keydown", beiTaste);
    };
  }, [offen]);

  const begriff = suche.trim().toLowerCase();
  const treffer = begriff ? optionen.filter((o) => o.label.toLowerCase().includes(begriff)) : optionen;

  return (
    <div className="filter-klapper" ref={wurzel}>
      <button
        ref={knopf}
        type="button"
        className={`chip filter-pille filter-mehr${versteckteGewaehlt > 0 ? " active" : ""}`}
        aria-expanded={offen}
        aria-controls={panelId}
        onClick={() => {
          setOffen(!offen);
          setSuche("");
        }}
      >
        {/* Beschriftung bleibt konstant: eine Auswahl aus dem Klapper steht als
            eigene Pille in der Zeile, ein Zähler hier wäre dieselbe Aussage zweimal. */}
        Mehr anzeigen ({optionen.length})
        <span className="filter-mehr-pfeil" aria-hidden="true" />
      </button>
      {offen && (
        <div className="filter-klapper-panel" id={panelId}>
          <label className="sr-only" htmlFor={sucheId}>
            {label} suchen
          </label>
          <input
            ref={feld}
            id={sucheId}
            type="search"
            className="filter-klapper-suche"
            value={suche}
            placeholder={suchePlatzhalter}
            autoComplete="off"
            onChange={(e) => setSuche(e.target.value)}
          />
          <div className="filter-klapper-liste" role="group" aria-label={label}>
            {treffer.length > 0 ? (
              treffer.map((o) => (
                <label key={o.value} className="filter-option">
                  <input
                    type="checkbox"
                    checked={ausgewaehlt.includes(o.value)}
                    onChange={() => onToggle(o.value)}
                  />
                  <span className="filter-option-label">{o.label}</span>
                  <span className="filter-option-zahl">{o.count}</span>
                </label>
              ))
            ) : (
              <p className="filter-klapper-leer">Nichts gefunden.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
