# Steffen Vorholt – Comedy-Universum (Next.js + Supabase)

Marketing-Website für das Comedy-Universum von Steffen Vorholt (Brain Loading, Comedy Eiskalt,
Comedy Check-In) im „Cosmic-Galaxie"-Design — mit Supabase-Backend und Admin-Dashboard
(„Mission Control"). Deployment-ready für **Vercel**.

## Stack

- Next.js (App Router) · React · TypeScript · plain CSS (`app/globals.css`, kein Tailwind)
- **Supabase**: Postgres (Shows, Termine, Anfragen, Galerie, One-Liner, Impressum), Auth, Storage
- **Resend** für E-Mail-Benachrichtigungen bei Anfragen (optional in Dev)
- Three.js + GSAP ScrollTrigger für den scrollgebundenen 2.5D-Hero und Abschnittsübergänge
- canvas-confetti für den Buzzer; alle Motion-Pfade respektieren `prefers-reduced-motion`
- Öffentliche Seiten: ISR (`revalidate = 3600`) + Sofort-Revalidation nach jeder Admin-Mutation

## Setup

```bash
npm install
cp .env.example .env.local   # Werte eintragen (siehe unten)
npm run dev                  # http://localhost:3000
```

Env-Variablen (`.env.local`, niemals committen):

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Pflicht
- `RESEND_API_KEY` + `NOTIFICATION_EMAIL` — optional (ohne: Anfragen landen nur in der DB)
- `EMAIL_FROM` (Default: `onboarding@resend.dev`), `NEXT_PUBLIC_SITE_URL` (Default: `https://steffenvorholt.de`)

Supabase-Setup: `supabase/migrations/0001_init.sql` ausführen (Schema, RLS, Storage-Buckets),
dann `supabase/seed.sql` (Startdaten). In Supabase Auth: Signups deaktivieren und Admin-Accounts
manuell anlegen.

## Admin („Mission Control")

`/admin` — geschützt per Supabase Auth (Middleware leitet ohne Session auf `/admin/login`).
Module: Übersicht (KPIs), Shows (CRUD + Planet-Upload), Termine, Anfragen-Inbox,
Galerie & Hero-Video, One-Liner (Buzzer), Impressum-Editor. Jede Mutation revalidiert
die öffentlichen Seiten sofort.

## Befehle

```bash
npm run dev      # Dev-Server
npm run build    # Produktions-Build (muss fehlerfrei sein)
npm run start    # Build lokal starten
npm test         # node --test (Event-/Kalender-Helper, mediaUrl, Markdown, JSON-LD)
```

## Struktur

```
app/                      App Router
  page.tsx                Startseite (Ticker, Planeten-Cluster, Buzzer, Galerie)
  shows/                  Übersicht + dynamische Show-Seiten /shows/[slug] (SSG aus DB)
  termine/                Kalender + gefilterte Terminliste
  kontakt/                Booking-Anfrage + Comedian-Bewerbung (echte Submits)
  impressum/ datenschutz/ Rechtliches (Impressum aus DB, noindex)
  admin/                  Login + Dashboard (Route-Group, Server Actions)
  sitemap.ts robots.ts opengraph-image.tsx
components/               UI (Planet, Ticker, Buzzer, Calendar, …), motion/, admin/
lib/                      Supabase-Clients, Datenzugriff, Actions, Helper (getestet)
supabase/                 0001_init.sql (Schema/RLS/Storage) + seed.sql
public/assets/media/...   Lokale Medien (unter /assets/media/… ausgeliefert)
```

## Motion & Performance

Alle öffentlichen Seiten haben einen site-weiten Three.js-Galaxy-Hintergrund
(`components/GalaxyBackground.tsx`): Sternenfeld mit Twinkle-Shader, additive Nebel-Sprites in
Markenfarben, Sternschnuppen sowie Scroll- und Pointer-Parallaxe. Der Canvas ist rein dekorativ
(`aria-hidden`, `pointer-events:none`), lädt Three.js nur clientseitig, cappt die Pixel-Ratio
(Desktop 1.6 / Mobile 1.25), pausiert bei verstecktem Tab und blendet erst nach dem ersten
gerenderten Frame ein — ohne WebGL, bei `Save-Data` oder `prefers-reduced-motion` bleibt der
statische CSS-Gradient-Fallback stehen. GSAP `ScrollTrigger` steuert Abschnittsübergänge
(`components/home/SectionTransition.tsx`) auf Startseite und /steffen; der Admin-Bereich bleibt
komplett ohne Galaxy/Motion.

## SEO

JSON-LD (`ComedyEvent`, `Person`, `BreadcrumbList`), dynamische Sitemap, robots.txt
(sperrt `/admin`), Canonicals via `metadataBase`, generierte OG-Images (Default + pro Show),
`next/image` für Inhaltsbilder.

## Deployment (Vercel)

1. Repo auf Vercel importieren (Framework: Next.js, Default-Einstellungen).
2. Env-Variablen aus `.env.example` im Vercel-Dashboard setzen.
3. Build Command `next build` — Output wird automatisch erkannt.

Security-Header und Media-Caching kommen aus `next.config.ts`.

## Vor Go-Live

- Impressum-/Datenschutz-Platzhalter ausfüllen (Impressum direkt im Admin editierbar)
- Lighthouse-Check (Performance/SEO ≥ 90) und Rich-Results-Test für `/termine`
