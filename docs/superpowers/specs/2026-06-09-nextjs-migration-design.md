# Next.js Migration – Design Spec

**Datum:** 2026-06-09
**Ziel:** Bestehende statische Multi-Page-HTML-Website ("Steffen Vorholt Comedy") in ein Next.js-Projekt überführen, deployment-ready für Vercel, dann auf `github.com/jjokkln/Steffen-Vorholt-Comedy.git` pushen.

## Entscheidungen (mit User abgestimmt)

1. **Faithful Port** – Design bleibt 1:1. App Router + TypeScript, bestehende `styles.css` wird unverändert zu `app/globals.css`. HTML → JSX, Klassen/Markup identisch.
2. **Admin** – als statische Mock-Seiten mitnehmen (unfunktional, wie heute), im Deploy enthalten.
3. **Daten** – statisch im Code (`lib/events.ts`). Supabase als späterer Schritt, keine Env-Secrets nötig.

## Stack

- Next.js (latest, App Router) · React · TypeScript
- Statisch gerendert (SSG) – kein Server, keine externe Abhängigkeit
- Deploy: Vercel (Auto-Detection für Next.js)

## Architektur

```
app/
  layout.tsx              # <html lang="de">, importiert globals.css, rendert <Nav/> + .page + {children} + <Footer/>
  globals.css             # = styles.css + .legal-Styles (aus den Inline-<style> der Rechtsseiten)
  page.tsx                # Home
  shows/page.tsx
  shows/brain-loading/page.tsx | comedy-eiskalt | comedy-check-in
  shows/brain-loading-termine/page.tsx | comedy-eiskalt-termine | comedy-check-in-termine
  termine/page.tsx
  kalender/page.tsx
  archiv/page.tsx
  comedians-bewerben/page.tsx
  steffen-buchen/page.tsx
  impressum/page.tsx      # metadata.robots = noindex
  datenschutz/page.tsx    # metadata.robots = noindex
  admin/page.tsx
  admin/shows | termine | kalender | anfragen | cms /page.tsx
components/
  Nav.tsx                 # "use client" – aktiver Link via usePathname()
  Footer.tsx              # variant: "default" | "calendar"
  EventCard.tsx           # rein präsentational (von EventGrid + TermineFilters genutzt)
  EventGrid.tsx           # rendert EVENTS (prop: showOnly?)
  BookingList.tsx         # rendert EVENTS als Zeilen (prop: showOnly?)
  EventSummary.tsx        # Summary-Cards für /kalender
  Calendar.tsx            # Monatsraster
  HomeHero.tsx            # "use client" – Hero inkl. Layout-Toggle (localStorage)
  TermineFilters.tsx      # "use client" – Filter-Chips + gefiltertes Grid
  FakeForm.tsx            # "use client" – onSubmit -> alert (ersetzt fakeSubmit())
lib/
  events.ts               # EVENTS, SHOW_META, Typen, targetForEvent()
public/assets/media/...   # Medien unverändert (Pfade bleiben /assets/media/...)
next.config.ts            # Security-Header + immutable-Cache für /assets/media
tsconfig.json, package.json, .gitignore (erweitert), README (aktualisiert)
```

## Komponenten-Verträge

- **Nav** (client): liest `usePathname()`, setzt `.active`. Logik: Home `/`, Shows `/shows` + Showseiten (nicht `-termine`), Termine `/termine`, Kalender `/kalender` + `*-termine`, Archiv, Comedians (`/comedians-bewerben`), Booking (`/steffen-buchen`), Admin (`/admin*`). Termine-Link trägt immer `ticket`. Logo: SVG (einheitlich, auch im Admin – kleine Konsistenz-Verbesserung gegenüber bisherigem 🎤-Emoji).
- **Footer**: `variant="calendar"` auf `/kalender` und `*-termine` (Spalte „Kalender" statt „Rechtliches"), sonst `default`.
- **EventGrid / BookingList**: Server-Komponenten, importieren `EVENTS`, optional auf `showOnly` gefiltert. `targetForEvent(e) = e.ticketUrl || "/admin/termine"`.
- **Calendar / EventSummary**: Server, statisches Rendering wie bisheriges `renderCalendar`/`renderSummary`.
- **HomeHero** (client): voller Hero-Header inkl. Karte/Vollfläche-Toggle, persistiert `homeHeroMode` in localStorage, toggelt `.is-full-video`.
- **TermineFilters** (client): Filter-State, rendert Chips + `EventCard`-Liste (Filter: all | show | city.includes).
- **FakeForm** (client): `<form onSubmit>` -> `alert(message + " – final: Supabase speichern + E-Mail senden.")`.

## Datenfluss

Events liegen statisch in `lib/events.ts` (identische Daten wie bisher in `main.js`/`events.json`). Listen, Kalender und Summary sind Server-Komponenten (kein Client-JS). Interaktiv nur: Nav (aktiver Link), HomeHero (Toggle), TermineFilters (Filter), FakeForm (Mock-Submit).

## Header / Vercel

Security-Header aus `vercel.json` wandern nach `next.config.ts` (`headers()`): `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. Plus `immutable`-Cache für `/assets/media/:path*`. `vercel.json` wird gelöscht (Vercel erkennt Next.js automatisch).

## SEO / Meta

Jede Seite exportiert `metadata` (Title + Description wie die alten `<title>`/`<meta>`). `impressum` + `datenschutz`: `robots: { index: false }` (entspricht bisherigem `noindex`).

## Tests

`tests/media-integration.test.mjs` wird angepasst: prüft, dass die 5 WebP-Dateien + das Hero-MP4 unter `public/assets/media` existieren und gültig sind, und dass `HomeHero.tsx`/`lib/events.ts`/Komponenten die erwarteten Medien referenzieren (inkl. `autoPlay/muted/loop/playsInline`, Toggle-Modi `card`/`full`). Lauf via `npm test` (node --test).

## Verifikation

`npm install` + `npm run build` müssen fehlerfrei durchlaufen, danach Commit + Push.

## Nicht in Scope (spätere Schritte)

- Supabase-Anbindung, echte Formular-Backends, Auth fürs Admin
- `next/image`-Optimierung (bewusst `<img>`/`<video>` beibehalten)
- Inhaltliche/Design-Änderungen
```
