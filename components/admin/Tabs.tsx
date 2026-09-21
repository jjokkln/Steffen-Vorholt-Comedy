"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/**
 * Reiter für die Admin-Oberfläche. Ein Baustein, drei Einsatzorte: Show-Formular,
 * „Termine & Orte" und „Social & YouTube".
 *
 * ⚠️ `keepMounted` ist der Punkt, an dem man sich hier die Finger verbrennt.
 * Im Show-Formular liegen alle Reiter in EINEM <form>. Würden die inaktiven
 * abgehängt (`{active === i && <Panel/>}`), verschwänden ihre Felder aus dem
 * FormData — Speichern würde stillschweigend die Beschreibung leeren, nur weil
 * man zuletzt auf „Bilder" stand. Deshalb bleiben sie gerendert und werden nur
 * mit `hidden` versteckt: unsichtbar, nicht fokussierbar, aber im Formular.
 * Für reine Ansichten (Listen) ist `keepMounted={false}` richtig, das spart
 * das Rendern der nicht gezeigten Tabellen.
 *
 * Tastatur nach WAI-ARIA Tabs Pattern: ←/→ wechselt, Home/End springt an den
 * Rand, und nur der aktive Reiter ist per Tab erreichbar (roving tabindex).
 */

export type TabDef = {
  /** Stabiler Schlüssel, erscheint auch im URL-Fragment nicht — rein intern. */
  id: string;
  label: string;
  /** Kleine Zahl hinter der Beschriftung, z. B. Anzahl der Einträge. */
  count?: number;
  /** Warnzeichen vor der Beschriftung, wenn in diesem Reiter etwas fehlt. */
  warn?: boolean;
  content: ReactNode;
};

export default function Tabs({
  tabs,
  keepMounted = false,
  ariaLabel,
}: {
  tabs: TabDef[];
  keepMounted?: boolean;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const last = tabs.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="admin-tabs">
      <div className="admin-tablist" role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
        {tabs.map((t, i) => {
          const selected = i === active;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? "admin-tab active" : "admin-tab"}
              onClick={() => setActive(i)}
            >
              {t.warn && <span aria-hidden="true">⚠ </span>}
              {t.label}
              {typeof t.count === "number" && <span className="admin-tab-count">{t.count}</span>}
              {t.warn && <span className="sr-only"> — hier fehlt etwas</span>}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => {
        const selected = i === active;
        if (!keepMounted && !selected) return null;
        return (
          <div
            key={t.id}
            role="tabpanel"
            id={`${base}-panel-${t.id}`}
            aria-labelledby={`${base}-tab-${t.id}`}
            hidden={!selected}
            tabIndex={0}
            className="admin-tabpanel"
          >
            {t.content}
          </div>
        );
      })}
    </div>
  );
}
