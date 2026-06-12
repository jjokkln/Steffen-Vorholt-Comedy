# Phase 2: Struktur-Umbau (Merges, Redirects, dynamische Shows) — Tasks 6–10

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Seitenstruktur: Nav schlank, `/termine` = „Termine & Kalender", `/kontakt` = „Kontakt & Bewerbung", Archiv weg, Shows dynamisch aus der DB.

**Architecture:** Öffentliche Seiten = Server Components mit `export const revalidate = 3600`, Daten via `lib/data.ts`. Interaktive Teile (Kalender-Monatswechsel, Filter) sind Client Components mit serialisierbaren Props.

**Tech Stack:** Next.js App Router, Supabase Public-Client.

---

### Task 6: Redirects, Nav, Footer, Archiv löschen

**Files:**
- Modify: `next.config.ts`, `components/Nav.tsx`, `components/Footer.tsx`, `app/page.tsx` (nur Archiv-Button), `app/kalender/page.tsx` → löschen erst in Task 8
- Delete: `app/archiv/page.tsx`

- [x] **Step 1: Redirects in `next.config.ts`** — Block in `nextConfig` ergänzen (neben `headers`):

```ts
async redirects() {
  return [
    { source: "/kalender", destination: "/termine", permanent: true },
    { source: "/steffen-buchen", destination: "/kontakt", permanent: true },
    { source: "/comedians-bewerben", destination: "/kontakt", permanent: true },
    { source: "/archiv", destination: "/", permanent: true },
    { source: "/shows/:slug-termine", destination: "/shows/:slug", permanent: true },
  ];
},
```

- [x] **Step 2: `components/Nav.tsx` komplett ersetzen:**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LOGO = "/assets/media/brand/steffen-vorholt-logo-primary.svg";

export default function Nav() {
  const pathname = usePathname();
  const cls = (active: boolean, extra = "") =>
    [extra, active ? "active" : ""].filter(Boolean).join(" ");

  return (
    <nav className="nav">
      <Link className="brand" href="/">
        <span className="logo">
          <img src={LOGO} alt="" />
        </span>
        <span>Steffen Vorholt</span>
      </Link>
      <div className="navlinks">
        <Link className={cls(pathname === "/")} href="/">
          Home
        </Link>
        <Link className={cls(pathname === "/shows" || pathname.startsWith("/shows/"))} href="/shows">
          Shows
        </Link>
        <Link className={cls(pathname === "/termine", "ticket")} href="/termine">
          Termine &amp; Kalender
        </Link>
        <Link className={cls(pathname === "/kontakt")} href="/kontakt">
          Kontakt &amp; Bewerbung
        </Link>
      </div>
    </nav>
  );
}
```

(Kein Admin-, Archiv-, Kalender-, Comedians-Link mehr. `/admin` ist nur noch per Direktaufruf erreichbar.)

- [x] **Step 3: `components/Footer.tsx` komplett ersetzen** (async Server Component, Shows dynamisch, `variant` entfällt — alle Aufrufer `<Footer variant="calendar">` auf `<Footer />` ändern, betrifft `app/kalender/page.tsx` bis Task 8):

```tsx
import Link from "next/link";
import { getActiveShows } from "@/lib/data";

const LOGO = "/assets/media/brand/steffen-vorholt-logo-primary.svg";

export default async function Footer() {
  const shows = await getActiveShows();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="logo">
              <img src={LOGO} alt="" />
            </span>
            <span>Comedy-Universum</span>
          </Link>
          <p>Steffen Vorholt · Comedian, Moderator und Veranstalter aus Neuss.</p>
        </div>
        <div>
          <h4>Shows</h4>
          <p>
            {shows.map((s) => (
              <span key={s.id}>
                <Link href={`/shows/${s.slug}`}>{s.name}</Link>
                <br />
              </span>
            ))}
          </p>
        </div>
        <div>
          <h4>Aktionen</h4>
          <p>
            <Link href="/termine">Termine &amp; Tickets</Link>
            <br />
            <Link href="/kontakt">Kontakt &amp; Bewerbung</Link>
          </p>
        </div>
        <div>
          <h4>Rechtliches</h4>
          <p>
            <Link href="/impressum">Impressum</Link>
            <br />
            <Link href="/datenschutz">Datenschutz</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [x] **Step 4: Archiv löschen + Verweise fixen**

```bash
rm app/archiv/page.tsx
```

In `app/page.tsx` den Button `<Link className="btn secondary" href="/archiv">Archiv ansehen</Link>` ersetzen durch `<Link className="btn secondary" href="/termine">Alle Termine</Link>`. In `app/kalender/page.tsx` `<Footer variant="calendar" />` → `<Footer />`.

- [x] **Step 5: Build + Sichtprüfung** — `npm run build` → fehlerfrei. `npm run dev`: Nav zeigt 4 Punkte, `/archiv` leitet auf `/` um, Footer listet die 3 Shows aus der DB.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: neue Navigation, dynamischer Footer, Redirects, Archiv-Seite entfernt"
```

---

### Task 7: Kalender-Helper (TDD) + Kalender-Komponente

**Files:**
- Create: `lib/calendar-helpers.ts`, Test: `tests/calendar-helpers.test.ts`
- Modify (ersetzen): `components/Calendar.tsx`

- [x] **Step 1: Failing Test** — `tests/calendar-helpers.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCalendarCells, monthTitle, shiftMonth } from "../lib/calendar-helpers.ts";

test("Januar 2024 beginnt Montag (kein Offset)", () => {
  const cells = buildCalendarCells(2024, 1);
  assert.equal(cells[0].day, 1);
  assert.equal(cells[0].iso, "2024-01-01");
  assert.equal(cells.length % 7, 0);
});

test("Februar 2024 beginnt Donnerstag (Offset 3) und hat 29 Tage", () => {
  const cells = buildCalendarCells(2024, 2);
  assert.equal(cells[0].day, null);
  assert.equal(cells[3].day, 1);
  assert.equal(cells.filter((c) => c.day !== null).length, 29);
});

test("monthTitle deutsch", () => {
  assert.equal(monthTitle(2026, 6), "Juni 2026");
});

test("shiftMonth über Jahresgrenzen", () => {
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
});
```

- [x] **Step 2: `npm test`** → Expected: FAIL (Modul fehlt).

- [x] **Step 3: Implementieren** — `lib/calendar-helpers.ts`:

```ts
const MONTHS_LONG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export interface CalendarCell {
  day: number | null;
  iso: string | null;
}

export function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, iso: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, iso: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null });
  return cells;
}

export function monthTitle(year: number, month: number): string {
  return `${MONTHS_LONG[month - 1]} ${year}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}
```

- [x] **Step 4: `npm test`** → Expected: PASS.

- [x] **Step 5: `components/Calendar.tsx` komplett ersetzen** (Client Component mit Monats-State; Events kommen serialisiert vom Server):

```tsx
"use client";

import { useState } from "react";
import { buildCalendarCells, monthTitle, shiftMonth } from "@/lib/calendar-helpers";
import type { EventRow } from "@/lib/types";

export default function Calendar({
  events,
  initialYear,
  initialMonth,
}: {
  events: EventRow[];
  initialYear: number;
  initialMonth: number;
}) {
  const [{ year, month }, setYm] = useState({ year: initialYear, month: initialMonth });
  const byIso = new Map<string, EventRow[]>();
  for (const e of events) {
    byIso.set(e.date, [...(byIso.get(e.date) ?? []), e]);
  }
  const cells = buildCalendarCells(year, month);

  return (
    <div>
      <div className="calendar-head">
        <div>
          <span className="badge">Kalenderansicht</span>
          <h3>{monthTitle(year, month)}</h3>
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button className="btn secondary" type="button" onClick={() => setYm(shiftMonth(year, month, -1))}>
            ← Vorheriger
          </button>
          <button className="btn secondary" type="button" onClick={() => setYm(shiftMonth(year, month, 1))}>
            Nächster →
          </button>
        </div>
      </div>
      <div className="calendar-grid-large" data-calendar-grid>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <div className="calendar-weekday" key={d}>
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const items = cell.iso ? (byIso.get(cell.iso) ?? []) : [];
          return (
            <div className={`calendar-cell ${cell.day ? "" : "dim"}`} key={i}>
              <div className="calendar-cell-number">{cell.day ?? ""}</div>
              {items.map((e) => (
                <a
                  key={e.id}
                  className="calendar-event"
                  style={{ background: e.shows?.color ?? "#7CFF6B", color: "#050711" }}
                  href={e.ticket_url || `/shows/${e.shows?.slug ?? ""}`}
                  target={e.ticket_url ? "_blank" : "_self"}
                  rel="noreferrer"
                >
                  {e.shows?.name}
                  <br />
                  {e.city}
                </a>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [x] **Step 6: Build** — `npm run build` → fehlerfrei (Komponente ist noch unbenutzt, alte `/kalender`-Seite nutzt sie mit alter Signatur → falls Build deshalb bricht, in `app/kalender/page.tsx` den `<Calendar />`-Aufruf temporär entfernen; die Seite fällt in Task 8 weg).

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: echter Monatskalender mit Show-Farben und Monatswechsel (getestet)"
```

---

### Task 8: Merged Page „Termine & Kalender" unter /termine

**Files:**
- Modify (ersetzen): `components/EventCard.tsx`, `components/EventGrid.tsx`, `components/TermineFilters.tsx`, `app/termine/page.tsx`, `app/page.tsx` (EventGrid-Aufruf bleibt — Signatur kompatibel)
- Delete: `app/kalender/page.tsx`, `components/BookingList.tsx`, `components/EventSummary.tsx`

- [x] **Step 1: `components/EventCard.tsx` ersetzen** (arbeitet jetzt mit `EventRow`):

```tsx
import { formatDay, formatMonth, todayIso } from "@/lib/event-helpers";
import type { EventRow } from "@/lib/types";

export default function EventCard({ event }: { event: EventRow }) {
  const isPast = event.date < todayIso();
  const hasTicket = Boolean(event.ticket_url);
  const status = isPast
    ? { cls: "archive", label: "Vergangen" }
    : hasTicket
      ? { cls: "live", label: "Tickets verfügbar" }
      : { cls: "draft", label: "Tickets bald verfügbar" };

  return (
    <article className="card event-card">
      <div>
        <div className="event-top">
          <div>
            <h4>{event.shows?.name}</h4>
            <p>
              {event.city} · {event.venue}
            </p>
            <span className={`status ${status.cls}`}>{status.label}</span>
          </div>
          <div className="datebox" style={{ borderColor: event.shows?.color }}>
            <strong>{formatDay(event.date)}</strong>
            <span>{formatMonth(event.date)}</span>
          </div>
        </div>
      </div>
      <div>
        <p>
          {event.start_time ? `Showbeginn: ${event.start_time}` : "Uhrzeit folgt"}
          {event.entry_time ? ` · Einlass: ${event.entry_time}` : ""}
          {event.provider ? <><br />{event.provider}</> : null}
        </p>
        {hasTicket && !isPast ? (
          <a className="btn primary" href={event.ticket_url} target="_blank" rel="noreferrer">
            🎟 Tickets sichern
          </a>
        ) : (
          <a className="btn secondary" href={`/shows/${event.shows?.slug ?? ""}`}>
            Zur Show
          </a>
        )}
      </div>
    </article>
  );
}
```

- [x] **Step 2: `components/EventGrid.tsx` ersetzen** (async Server Component, lädt selbst aus der DB; `showOnly` = Show-NAME, kompatibel zu bestehenden Aufrufen in `app/page.tsx` und den alten Show-Seiten):

```tsx
import EventCard from "@/components/EventCard";
import { getPublishedEvents } from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";

export default async function EventGrid({
  showOnly,
  includePast = false,
  limit,
}: {
  showOnly?: string;
  includePast?: boolean;
  limit?: number;
}) {
  const all = await getPublishedEvents();
  const filtered = showOnly ? all.filter((e) => e.shows?.name === showOnly) : all;
  const { upcoming, past } = partitionEvents(filtered);
  let items = includePast ? [...upcoming, ...past] : upcoming;
  if (limit) items = items.slice(0, limit);

  return (
    <div className="grid-3" data-events-grid>
      {items.length ? (
        items.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <div className="booking-empty">Keine Termine? Steffen schreibt gerade neue Witze. Schau bald wieder rein!</div>
      )}
    </div>
  );
}
```

- [x] **Step 3: `components/TermineFilters.tsx` ersetzen** (Client, Daten als Props — Filter aus DB-Shows + Städten generiert):

```tsx
"use client";

import { useMemo, useState } from "react";
import EventCard from "@/components/EventCard";
import type { EventRow, Show } from "@/lib/types";

export default function TermineFilters({ events, shows }: { events: EventRow[]; shows: Show[] }) {
  const [active, setActive] = useState("all");
  const cities = useMemo(() => [...new Set(events.map((e) => e.city))].sort(), [events]);
  const filters = [
    { value: "all", label: "Alle" },
    ...shows.map((s) => ({ value: `show:${s.slug}`, label: s.name })),
    ...cities.map((c) => ({ value: `city:${c}`, label: c })),
  ];
  const items = events.filter((e) => {
    if (active === "all") return true;
    if (active.startsWith("show:")) return e.shows?.slug === active.slice(5);
    return e.city === active.slice(5);
  });

  return (
    <>
      <div className="filters" data-filters>
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`chip${active === f.value ? " active" : ""}`}
            onClick={() => setActive(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="grid-3" data-events-grid>
        {items.length ? (
          items.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="booking-empty">Für diesen Filter ist nichts geplant — Steffen arbeitet dran.</div>
        )}
      </div>
    </>
  );
}
```

- [x] **Step 4: `app/termine/page.tsx` ersetzen** (erst Kalender, dann kompletter Termine-Inhalt — Reihenfolge ist eine User-Entscheidung, nicht ändern):

```tsx
import type { Metadata } from "next";
import Calendar from "@/components/Calendar";
import TermineFilters from "@/components/TermineFilters";
import Footer from "@/components/Footer";
import { getActiveShows, getPublishedEvents } from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Termine & Kalender – Steffen Vorholt",
  description: "Alle Shows, Orte und Ticketlinks von Steffen Vorholt – als Kalender und Liste.",
};

export default async function TerminePage() {
  const [events, shows] = await Promise.all([getPublishedEvents(), getActiveShows()]);
  const { upcoming } = partitionEvents(events);
  const now = new Date();

  return (
    <>
      <header className="container section">
        <div className="eyebrow">🗓️ Termine &amp; Kalender</div>
        <h1>Alle Shows. Alle Orte. Ein Kalender.</h1>
        <p className="lead">
          Wann spielt welche Show wo? Hier findest du jeden Termin – Ticketbuttons führen direkt zum
          externen Anbieter.
        </p>
      </header>

      <section className="container section">
        <div className="public-calendar">
          <div className="eventbar" style={{ marginBottom: "16px" }}>
            {shows.map((s) => (
              <span key={s.id} className="status" style={{ background: s.color, color: "#050711" }}>
                {s.name}
              </span>
            ))}
          </div>
          <Calendar events={events} initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} />
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="eyebrow">🎟️ Alle Termine</div>
            <h2>Finde deine Comedy-Mission.</h2>
          </div>
          <p>Filter nach Show oder Stadt. {upcoming.length} kommende Termine.</p>
        </div>
        <TermineFilters events={upcoming} shows={shows} />
      </section>

      <Footer />
    </>
  );
}
```

- [x] **Step 5: Aufräumen**

```bash
rm app/kalender/page.tsx components/BookingList.tsx components/EventSummary.tsx
```

`grep -rn "BookingList\|EventSummary" app components` → Expected: keine Treffer mehr.

- [x] **Step 6: Build + Sichtprüfung** — `npm run build` → fehlerfrei. Dev: `/termine` zeigt Kalender (mit den 2 Seed-Events im Feb/Apr 2026 beim Zurückblättern), darunter Filter + Liste; `/kalender` leitet um.

- [x] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: Termine & Kalender zusammengeführt unter /termine (DB-basiert)"
```

---

### Task 9: Merged Page „Kontakt & Bewerbung" unter /kontakt

**Files:**
- Create: `app/kontakt/page.tsx`
- Delete: `app/steffen-buchen/page.tsx`, `app/comedians-bewerben/page.tsx`

Die Formulare bleiben in diesem Task noch `FakeForm` (echte Submits kommen in Task 19 — Phase 4 ersetzt FakeForm vollständig).

- [x] **Step 1: `app/kontakt/page.tsx` anlegen:**

```tsx
import type { Metadata } from "next";
import FakeForm from "@/components/FakeForm";
import Footer from "@/components/Footer";
import { getActiveShows } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kontakt & Bewerbung – Steffen Vorholt",
  description:
    "Steffen Vorholt für Events buchen oder dich als Comedian für seine Shows bewerben – ein Formular, zwei Wege.",
};

export default async function KontaktPage() {
  const shows = await getActiveShows();
  return (
    <>
      <header className="container section">
        <div className="eyebrow">📡 Kontakt &amp; Bewerbung</div>
        <h1>Funkkontakt aufnehmen.</h1>
        <p className="lead">
          Du willst Steffen für dein Event buchen? Oder selbst auf eine seiner Bühnen? Beides startet
          hier.
        </p>
      </header>

      <section className="container section" id="buchen">
        <div className="feature">
          <div>
            <div className="eyebrow">🎤 Für Veranstalter</div>
            <h2>Steffen buchen.</h2>
            <p className="lead">Comedy, Moderation oder beides – für Firmenfeiern, Galas und Events.</p>
          </div>
          <FakeForm message="Booking-Anfrage gespeichert" className="card form">
            <h3>Booking-Anfrage</h3>
            <div className="form two">
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Firma
                <input name="company" />
              </label>
            </div>
            <div className="form two">
              <label>
                E-Mail
                <input name="email" type="email" required />
              </label>
              <label>
                Telefon
                <input name="phone" />
              </label>
            </div>
            <div className="form two">
              <label>
                Eventart
                <select name="event_type">
                  <option>Firmenfeier</option>
                  <option>Hochzeit</option>
                  <option>Gala</option>
                  <option>Moderation</option>
                  <option>Comedy-Auftritt</option>
                </select>
              </label>
              <label>
                Datum
                <input name="event_date" />
              </label>
            </div>
            <label>
              Nachricht
              <textarea name="message" placeholder="Ort, Gästezahl, Ablauf, gewünschte Leistung..." />
            </label>
            <button className="btn primary">Anfrage senden</button>
          </FakeForm>
        </div>
      </section>

      <section className="container section" id="bewerben">
        <div className="feature">
          <FakeForm message="Bewerbung gespeichert" className="card form">
            <h3>Comedian-Bewerbung</h3>
            <div className="form two">
              <label>
                Name
                <input name="name" required />
              </label>
              <label>
                Künstlername
                <input name="stage_name" />
              </label>
            </div>
            <div className="form two">
              <label>
                E-Mail
                <input name="email" type="email" required />
              </label>
              <label>
                Telefon
                <input name="phone" />
              </label>
            </div>
            <label>
              Instagram / TikTok / YouTube
              <input name="social_link" placeholder="https://..." />
            </label>
            <div className="form two">
              <label>
                Bevorzugte Show
                <select name="preferred_show">
                  {shows.map((s) => (
                    <option key={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Stadt
                <input name="city" />
              </label>
            </div>
            <label>
              Nachricht
              <textarea name="message" />
            </label>
            <button className="btn primary">Bewerbung absenden</button>
          </FakeForm>
          <div>
            <div className="eyebrow">🎭 Für Comedians</div>
            <h2>Du willst selbst auf die Bühne?</h2>
            <p className="lead">
              Keine Uploads nötig – schick einfach Links zu Instagram, TikTok oder YouTube. Steffen
              schaut alles persönlich an.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
```

- [x] **Step 2: Alte Seiten löschen**

```bash
rm app/steffen-buchen/page.tsx app/comedians-bewerben/page.tsx
rmdir app/steffen-buchen app/comedians-bewerben
```

`grep -rn "steffen-buchen\|comedians-bewerben" app components` → verbleibende Treffer fixen: in `app/page.tsx` und den alten Show-Seiten Links auf `/kontakt#bewerben` bzw. `/kontakt` umstellen (die Show-Seiten fallen in Task 10 ohnehin weg — dort reicht es, den Build grün zu halten).

- [x] **Step 3: Build + Sichtprüfung** — `npm run build`; Dev: `/kontakt` zeigt beide Formulare, `/steffen-buchen` leitet um.

- [x] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Kontakt & Bewerbung als gemeinsame Seite unter /kontakt"
```

---

### Task 10: Dynamische Show-Seiten `/shows/[slug]`

**Files:**
- Create: `app/shows/[slug]/page.tsx`
- Modify (ersetzen): `app/shows/page.tsx`
- Delete: `app/shows/brain-loading/`, `app/shows/comedy-eiskalt/`, `app/shows/comedy-check-in/`, `app/shows/brain-loading-termine/`, `app/shows/comedy-eiskalt-termine/`, `app/shows/comedy-check-in-termine/`

- [x] **Step 1: `app/shows/[slug]/page.tsx` anlegen:**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import { getActiveShows, getEventsForShowId, getShowBySlug } from "@/lib/data";
import { partitionEvents } from "@/lib/event-helpers";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const shows = await getActiveShows();
  return shows.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) return {};
  return { title: `${show.name} – Steffen Vorholt`, description: show.tagline };
}

export default async function ShowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const show = await getShowBySlug(slug);
  if (!show) notFound();
  const events = await getEventsForShowId(show.id);
  const { upcoming } = partitionEvents(events);

  return (
    <>
      <header className="container section hero">
        <div>
          <div className="eyebrow">
            <span className="dot" style={{ background: show.color, boxShadow: `0 0 24px ${show.color}` }}></span>{" "}
            {show.name} · {show.format_label}
          </div>
          <h1>{show.tagline}</h1>
          <p className="lead">{show.description}</p>
          <div className="actions">
            <Link className="btn primary" href="/termine">
              🎟 Termine &amp; Tickets
            </Link>
            <Link className="btn secondary" href="/kontakt#bewerben">
              Als Comedian bewerben
            </Link>
          </div>
        </div>
        <figure className="show-hero-media">
          <img src={mediaUrl(show.planet_image_path)} alt={`Planet der Show ${show.name}`} />
        </figure>
      </header>

      {show.principle_items.length > 0 && (
        <section className="container section">
          <div className="grid-2">
            <div className="card">
              <h3>Show-Prinzip</h3>
              <ul className="list">
                {show.principle_items.map((item) => (
                  <li key={item.title}>
                    <b>{item.title}</b>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3>Städte &amp; Locations</h3>
              <p>{show.cities_text}</p>
            </div>
          </div>
        </section>
      )}

      <section className="container section">
        <div className="section-head">
          <h2>Kommende {show.name}-Termine</h2>
          <p>Alle Termine inkl. anderer Shows findest du im Kalender.</p>
        </div>
        <div className="grid-3">
          {upcoming.length ? (
            upcoming.map((e) => <EventCard key={e.id} event={e} />)
          ) : (
            <div className="booking-empty">
              Gerade kein Termin geplant – Steffen schreibt vermutlich neue Witze. Schau im Kalender vorbei!
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
```

- [x] **Step 2: `app/shows/page.tsx` ersetzen** (Übersicht dynamisch):

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getActiveShows } from "@/lib/data";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shows – Steffen Vorholt",
  description: "Alle Comedy-Formate von Steffen Vorholt im Überblick.",
};

export default async function ShowsPage() {
  const shows = await getActiveShows();
  return (
    <>
      <header className="container section">
        <div className="eyebrow">🪐 Wähle deine Mission</div>
        <h1>Jede Show ein eigener Planet.</h1>
        <p className="lead">Impro, Open Mic oder Boarding – such dir aus, wo du landen willst.</p>
      </header>

      <section className="container section">
        <div className="grid-3">
          {shows.map((show) => (
            <article className="card show-card" key={show.id}>
              <div>
                <div className="top">
                  <span className="badge">{show.name}</span>
                  <span className="badge">{show.format_label}</span>
                </div>
                <div className="show-art">
                  <img src={mediaUrl(show.planet_image_path)} alt={`Planet der Show ${show.name}`} />
                </div>
                <div className="show-card-copy">
                  <h3>{show.tagline}</h3>
                  <p>{show.description}</p>
                </div>
              </div>
              <div className="actions">
                <Link className="btn primary" href={`/shows/${show.slug}`}>
                  Show öffnen
                </Link>
                <Link className="btn secondary" href="/termine">
                  Tickets
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
```

- [x] **Step 3: Statische Show-Seiten löschen**

```bash
rm -r app/shows/brain-loading app/shows/comedy-eiskalt app/shows/comedy-check-in \
      app/shows/brain-loading-termine app/shows/comedy-eiskalt-termine app/shows/comedy-check-in-termine
```

- [x] **Step 4: Build + Sichtprüfung** — `npm run build` → fehlerfrei, `/shows/brain-loading` wird statisch generiert. Dev: `/shows/brain-loading-termine` leitet auf `/shows/brain-loading` um; unbekannter Slug → 404.

- [x] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Shows vollständig dynamisch aus Supabase (/shows/[slug])"
```

---

## Abschluss-Notizen (2026-06-12)

Alle Tasks 6–10 umgesetzt, `npm run build` + `npm test` (10/10) grün. Verifiziert im Production-Server: alle 5 Redirects (308), `/termine`, `/kontakt`, `/shows`, `/shows/brain-loading` (200), unbekannter Slug (404). Abweichungen:

- `components/ShowTermine.tsx`: `BookingList` → `EventGrid showOnly` getauscht (BookingList gelöscht in Task 8); Komponente ist seit Task 10 ungenutzt → Kandidat für Aufräum-Task 28.
- `tests/media-integration.test.mjs` gelöscht (brach durch Wegfall der statischen Show-Seiten — vom Plan in Task 1 ausdrücklich vorgesehen).
