# Steffen Vorholt – Comedy-Universum (Next.js)

Multi-Page-Website für das Comedy-Universum von Steffen Vorholt (Brain Loading, Comedy Eiskalt,
Comedy Check-In). Ursprünglich ein statischer HTML-Blueprint, jetzt als **Next.js App Router**
Projekt mit TypeScript – deployment-ready für **Vercel**.

## Stack

- Next.js (App Router) · React · TypeScript
- Statisch gerendert (SSG), keine externe Abhängigkeit
- Bestehendes Design unverändert übernommen (globale CSS in `app/globals.css`)

## Entwicklung

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Produktions-Build
npm run start    # Build lokal starten
npm test         # Media-Integration-Check
```

## Struktur

```
app/                      App Router – eine page.tsx pro Route
  layout.tsx              <html lang="de">, globale CSS, Nav + Footer-Rahmen
  globals.css            # Design (= ehemalige assets/css/styles.css) + Legal-Styles
  page.tsx                Home
  shows/                  Übersicht, 3 Showseiten, 3 Show-Termin-Seiten
  termine/ kalender/ archiv/ comedians-bewerben/ steffen-buchen/
  impressum/ datenschutz/ (noindex)
  admin/                  Statische Mock-Seiten (Dashboard, ohne Backend)
components/               Nav, Footer, EventCard/Grid, BookingList, Calendar,
                          EventSummary, HomeHero, TermineFilters, FakeForm, AdminShell, ShowTermine
lib/events.ts             Statische Event-/Show-Daten + Helper
public/assets/media/...   Medien (werden unter /assets/media/... ausgeliefert)
next.config.ts            Security-Header + Cache-Header für /assets/media
```

## Routen

`/` · `/shows` · `/shows/brain-loading` · `/shows/comedy-eiskalt` · `/shows/comedy-check-in` ·
`/shows/brain-loading-termine` · `/shows/comedy-eiskalt-termine` · `/shows/comedy-check-in-termine` ·
`/termine` · `/kalender` · `/archiv` · `/comedians-bewerben` · `/steffen-buchen` ·
`/impressum` · `/datenschutz` · `/admin` (+ `/admin/shows|termine|kalender|anfragen|cms`)

## Deployment (Vercel)

Vercel erkennt Next.js automatisch – kein `vercel.json` nötig.

1. Repo auf Vercel importieren (Framework: Next.js, Default-Einstellungen).
2. Build Command `next build`, Output wird automatisch erkannt.
3. Keine Environment-Variablen erforderlich (Daten sind statisch).

Security-Header (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security`) und Caching kommen aus `next.config.ts`.

## Nächste Schritte (nicht Teil dieses Builds)

- Event-Daten aus **Supabase** laden statt statisch in `lib/events.ts`
- Echte Formular-Backends (Comedian-Bewerbung, Booking) + E-Mail-Versand
- Auth / echtes CMS für den Admin-Bereich
- Vor Go-Live: Platzhalter in `impressum`/`datenschutz` ausfüllen
- Optional: `next/image` statt `<img>`, fehlende Medien aus `docs/media-manifest.md` ergänzen
