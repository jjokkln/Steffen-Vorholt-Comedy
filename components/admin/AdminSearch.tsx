"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LEGAL_PAGES } from "@/lib/legal";
import type { SucheTreffer } from "@/app/api/admin/suche/route";

/**
 * Suchleiste in der Admin-Topbar. Zwei Quellen in einer Liste:
 *
 * • **Bereiche** — clientseitig aus einer festen Liste. Braucht keinen Server,
 *   ist deshalb sofort da, während die Inhalte noch laden.
 * • **Inhalte** — aus `/api/admin/suche`, entprellt (250 ms).
 *
 * ⚠️ Die Bereichsliste hier veraltet lautlos: Ein neuer Admin-Bereich taucht in
 * der Suche nicht auf, und nichts wird dabei rot. Wer unter app/admin/ eine
 * Seite anlegt, ergänzt sie hier — dieselbe Pflicht wie bei `sitemap.ts` für
 * öffentliche Seiten.
 */

const BEREICHE: { label: string; href: string; alias?: string }[] = [
  { label: "Übersicht", href: "/admin" },
  { label: "Shows", href: "/admin/shows" },
  { label: "Termine & Orte", href: "/admin/termine", alias: "standorte venues kalender spielplan" },
  { label: "Comedians", href: "/admin/comedians" },
  { label: "Gastauftritte", href: "/admin/auftritte", alias: "open mic gig" },
  { label: "Anfragen", href: "/admin/anfragen", alias: "booking kontakt" },
  { label: "Partner", href: "/admin/partner" },
  { label: "Galerie", href: "/admin/galerie", alias: "bilder fotos" },
  { label: "Videos & Speicher", href: "/admin/medien", alias: "upload storage" },
  { label: "Social & YouTube", href: "/admin/social", alias: "instagram tiktok facebook video" },
  { label: "One-Liner", href: "/admin/oneliner", alias: "witze sprüche" },
  ...LEGAL_PAGES.map((p) => ({
    label: `Rechtliches › ${p.label}`,
    href: `/admin/rechtliches/${p.slug}`,
    alias: "recht dsgvo",
  })),
  { label: "Benachrichtigungen", href: "/admin/einstellungen", alias: "einstellungen mail" },
];

export default function AdminSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [offen, setOffen] = useState(false);
  const [treffer, setTreffer] = useState<SucheTreffer[]>([]);
  const [laedt, setLaedt] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const bereiche: SucheTreffer[] = q.trim().length
    ? BEREICHE.filter((b) => `${b.label} ${b.alias ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()))
        .slice(0, 5)
        .map((b) => ({ gruppe: "Bereiche", titel: b.label, href: b.href }))
    : [];

  const alle = [...bereiche, ...treffer];

  // Inhalte entprellt nachladen. Der AbortController verhindert, dass eine
  // langsame frühere Antwort eine schnellere spätere überschreibt.
  useEffect(() => {
    const needle = q.trim();
    if (needle.length < 2) {
      setTreffer([]);
      setLaedt(false);
      return;
    }
    const ctrl = new AbortController();
    setLaedt(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/suche?q=${encodeURIComponent(needle)}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { treffer: SucheTreffer[] };
        setTreffer(json.treffer ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setTreffer([]);
      } finally {
        if (!ctrl.signal.aborted) setLaedt(false);
      }
    }, 250);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [q]);

  useEffect(() => setCursor(0), [q]);

  // Klick daneben schließt. Schließt nicht bei Klick auf einen Treffer — der
  // navigiert ohnehin und räumt selbst auf.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOffen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ⌘K / Strg+K springt in die Leiste — der Griff, den man aus jedem Dashboard kennt.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOffen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function geheZu(href: string) {
    setOffen(false);
    setQ("");
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { setOffen(false); inputRef.current?.blur(); return; }
    if (!alle.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => (c + 1) % alle.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => (c - 1 + alle.length) % alle.length); }
    else if (e.key === "Enter") { e.preventDefault(); geheZu(alle[cursor].href); }
  }

  let letzteGruppe = "";

  return (
    <div className="admin-search" ref={boxRef}>
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOffen(true); }}
        onFocus={() => setOffen(true)}
        onKeyDown={onKeyDown}
        placeholder="Suchen…  ⌘K"
        aria-label="Im Dashboard suchen"
        role="combobox"
        aria-expanded={offen && alle.length > 0}
        aria-controls="admin-search-liste"
        aria-autocomplete="list"
      />
      {offen && q.trim().length > 0 && (
        <div className="admin-search-panel" id="admin-search-liste" role="listbox" aria-label="Suchergebnisse">
          {alle.length === 0 && !laedt && <p className="admin-search-leer">Nichts gefunden.</p>}
          {alle.map((t, i) => {
            const neueGruppe = t.gruppe !== letzteGruppe;
            letzteGruppe = t.gruppe;
            return (
              <div key={`${t.href}-${t.titel}-${i}`}>
                {neueGruppe && <p className="admin-search-gruppe">{t.gruppe}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === cursor}
                  className={i === cursor ? "admin-search-treffer aktiv" : "admin-search-treffer"}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => geheZu(t.href)}
                >
                  <span>{t.titel}</span>
                  {t.zusatz && <span className="admin-search-zusatz">{t.zusatz}</span>}
                </button>
              </div>
            );
          })}
          {laedt && <p className="admin-search-leer">Sucht…</p>}
        </div>
      )}
    </div>
  );
}
