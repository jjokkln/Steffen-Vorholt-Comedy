# Handoff: Cosmic-Galaxie Design-System & alle Seiten (steffen-vorholt)

## Überblick

Dieses Paket enthält das aus der bestehenden Codebasis **abgezogene** Design-System und
eine vollständige, korrigierte Darstellung **jeder Seite**, die das Programm heute hat —
plus zwei echte Neuerungen (scrollgebundener Hero, echte NRW-Karte).

Zielprojekt: `steffen-vorholt` — Next.js App Router, React, TypeScript, **plain CSS in
`app/globals.css`** (kein Tailwind), Supabase, Resend.

## Zu den Design-Dateien

Die `.dc.html`-Dateien sind **Design-Referenzen**, kein Produktionscode zum Kopieren.
Sie sind mit Inline-Styles gebaut, damit sie im Design-Tool live editierbar sind.
Im Zielprojekt gehören dieselben Werte in die bestehenden Klassen in `app/globals.css`
und die bestehenden Komponenten unter `components/` — **nicht** als Inline-Styles.

`nrw-karte.html` ist die einzige Ausnahme: echtes, lauffähiges HTML/JS (Leaflet), das als
Vorlage für eine React-Komponente dient.

## Fidelity

**High-Fidelity.** Alle Farben, Radien, Abstände und Typografie-Werte stammen 1:1 aus
`app/globals.css` (Stand 29.07.2026). Wo unten „NEU" steht, sind es bewusste Änderungen.
Bild-/Videoflächen sind schraffierte Platzhalter — echte Medien kommen aus Supabase Storage.

---

## Was übernommen werden soll — in dieser Reihenfolge

### 1. Bugfix: umbrechende Pillen (303 Stellen, betrifft die ganze Site)

Im Design-Nachbau fehlte an Buttons, Chips, Badges, Status-Pillen, Nav-Links und
Sidebar-Links `white-space:nowrap`. **Im Zielprojekt hat `.btn` das bereits** — aber
diese Selektoren **nicht**, und dort brechen die Labels auf zwei Zeilen und laufen aus
der Pille heraus:

```css
/* app/globals.css — ergänzen */
.chip,
.badge,
.status,
.navlinks a,
.sidebar a,
.social-chip,
.offer-badge,
.appearance-kind.badge,
.yt-placeholder-btn,
.consent-btn,
.map-results-count,
.loc-badge { white-space: nowrap; }
```

Sichtbar u. a. bei „Tickets bald verfügbar", „Galerie & Gästebuch", „Alle Termine im
Kalender", „Auf YouTube ansehen", „Standorte pflegen".

### 2. Bugfix: Video-Platzhalter — Label unter dem Play-Badge

`.media-placeholder` / Video-Thumbs zentrieren Label und Play-Badge auf denselben Punkt,
das Badge (`rgba(5,7,17,.48)` + `backdrop-filter:blur(8px)`) verdeckt den Text.

```css
.media-placeholder > span,
.show-media-item .media-thumb figcaption { align-self: end; padding-bottom: 22px; }
```

### 3. NEU: Scrollgebundener Hero (`components/home/HeroScrollExperience.tsx`)

Ersetzt die Dauerrotation (`@keyframes orbit-spin` / `orbit-hold`, 110/150/190 s) durch
eine **scrollgebundene** Bewegung. Referenz: Logik-Klasse in `01 Startseite.dc.html`.

Größen (in `globals.css`, `.hero-system` / `.hero-carrier`):

| | alt | neu |
|---|---|---|
| `.hero-system` Breite | `min(60vh,38vw,620px)` | `min(74vh,46vw,760px)` |
| `.hero-system` Position | `top:40%` | `top:37%`, `transform-origin:62% 46%` |
| z-index | `1` (unter dem Scrim) | `3` (über dem Scrim) |
| Planet primary | `30%` / Bahn `20%` | **`40%`** / Bahn `top:28%` |
| Planet secondary | `22%` / Bahn `27%` | **`29%`** / Bahn `top:33%` |
| Planet tertiary | `18%` / Bahn `34%` | **`23%`** / Bahn `top:9%` |
| Glow pro Planet | `drop-shadow(0 0 38px …4)` | `drop-shadow(0 0 46px …5)`, Hover `76px …85` |
| z-index Carrier | – | primary 3, secondary 2, tertiary 1 (Tiefenstaffelung) |

Bahn-Parameter:

```ts
const ORBITS = [
  { start: 28,  sweep: 210,  amp: 5,    speed: 0.16, depth: 0.46, drift: [ 26, -30] }, // Brain Loading
  { start: 148, sweep: -150, amp: -4,   speed: 0.11, depth: 0.24, drift: [ 22,  20] }, // Comedy Eiskalt
  { start: 68,  sweep: 108,  amp: 3.5,  speed: 0.09, depth: 0.10, drift: [ 14,  24] }, // Comedy Check-In
];
const SCROLL_DISTANCE = 620; // px
const NAV_HEIGHT = 84;
```

Pro `requestAnimationFrame` (kein React-State, direkte Style-Mutation über `useRef` —
genau wie der bestehende Scroll-Handler in `HeroScrollExperience.tsx`):

```
top   = heroEl.getBoundingClientRect().top
p     = clamp((NAV_HEIGHT - top) / SCROLL_DISTANCE, 0, 1)
ease  = p*p*(3-2*p)
secs  = (now - t0) / 1000        // 0 bei prefers-reduced-motion

system.style.transform = `scale(${1 + ease*0.34}) translate3d(${ease*-50}px,${ease*20}px,0)`
system.style.opacity   = 1 - ease*0.22

// pro Bahn i:
angle = start + ease*sweep + Math.sin(secs*speed)*amp
carrier[i].style.transform = `rotate(${angle}deg)`
hold[i].style.transform    = `rotate(${-angle}deg) scale(${1 + ease*depth})
                              translate3d(${ease*drift[0]}px,${ease*drift[1]}px,0)`
```

**Wichtig:** Der Leerlauf ist eine *begrenzte Schwingung* (`sin`, Amplitude 3.5–5°), keine
Dauerrotation. Die frühere Dauerrotation lässt die Komposition mit der Zeit wegwandern —
nach einer Minute liegen Planeten über Headline und Steffen-Foto.

DOM-Schachtelung (Rotation und Float dürfen nicht auf demselben Element liegen):

```
.hero-system            ← JS: scale + translate
  .hero-carrier         ← JS: rotate(angle)
    a.hero-planet       ← statisch: left:50%; top:<Bahn>%; translate:-50% -50%; width:<Größe>%
      span              ← JS: rotate(-angle) + scale + translate   (Gegenrotation)
        span            ← CSS: animation: planet-float 7s ease-in-out infinite
          Image
```

`will-change:transform` auf `.hero-system`, `.hero-carrier` und dem Gegenrotations-Span.
rAF-Loop bei `document.hidden` überspringen, in `componentWillUnmount` / Cleanup abbrechen.

### 4. NEU: Echte NRW-Karte statt 9-Punkt-Polygon

`lib/nrw-geo.ts` projiziert lat/lng auf eine viewBox 0–100 und zeichnet NRW als
**9-Punkt-`<polygon>`** — das ist der Grund, warum die Karte unprofessionell wirkt.

Ersetzen durch **Leaflet + OpenStreetMap-Tiles**. Vollständige, lauffähige Vorlage:
`nrw-karte.html` (in `components/shows/NRWMap.tsx` als React-Komponente überführen).

Kernpunkte:

- Pinned Tags (Hashes nicht ändern, `leaflet.css` ist Pflicht — ohne sie rendern die Tiles zerhackt):
  ```html
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous">
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH" crossorigin="anonymous"></script>
  ```
  In Next.js: `npm i leaflet` + `react-leaflet` und die Karte **client-only** laden
  (`dynamic(() => import(...), { ssr: false })`), Leaflet fasst `window` beim Import an.
- `attribution: "© OpenStreetMap contributors"` ist Lizenzpflicht — nie entfernen.
- Dunkles Marken-Look über einen CSS-Filter auf `.leaflet-tile-pane` (keine kostenpflichtigen Dark-Tiles nötig):
  ```css
  .leaflet-tile-pane{filter:invert(1) brightness(.84) contrast(1.04) grayscale(.9) sepia(.42) hue-rotate(176deg) saturate(2.4)}
  ```
  Varianten: `tief` → `brightness(.62) contrast(1.14) grayscale(.95) sepia(.5) hue-rotate(178deg) saturate(2.1)`; `neutral` → `filter:none`.
- Karten-Setup: `maxBounds` = `[[50.29,5.83],[52.55,9.50]]` (NRW) `.pad(0.35)`,
  `maxBoundsViscosity:.75`, `minZoom:6`, `maxZoom:15`, `zoomSnap:.25`,
  `scrollWheelZoom:false` (erst nach Klick aktivieren — sonst kapert die Karte das Seiten-Scrollen),
  `L.control.zoom({position:"bottomright"})`.
- Marker als `L.divIcon`: Punkt in **Show-Farbe** (`shows.color`), `box-shadow:0 0 0 2px rgba(5,7,17,.85), 0 0 18px var(--c), 0 0 42px var(--c)`,
  pulsierender Halo nur bei Orten **mit** Termin, Durchmesser 15 px mit / 11 px ohne Termin
  (× `markerScale`), Ortsname als Label darunter (11 px/800, `text-shadow` gegen die Tiles),
  Termin-Anzahl im Punkt ab 2 Terminen.
- „Sternbild"-Linien: jeder Ort → nächster Nachbar, `L.polyline` `#AEEBFF`, `weight:1`,
  `opacity:.28`, `dashArray:"3 7"`, `interactive:false`.
- Seitenspalte: Chip-Rail (Alle Orte + je Ort mit Farbpunkt) → `.map-results-head`
  (Eyebrow = Location, H2 = Stadt, Count-Pille) → Terminkarten mit Datums-Box.
  Klick auf Marker/Chip/Karte → `map.flyTo`, Auswahl gespiegelt.

**Admin-Modus „Standorte pflegen" (die eigentliche Anforderung):**

1. Modus-Umschalter oben rechts in der Karte (Segmented Control, „Besucher" / „Standorte pflegen").
2. Im Admin-Modus `cursor:crosshair`; **Klick in die Karte** setzt einen weißen Entwurfs-Marker
   und schreibt `lat`/`lng` (4 Dezimalen) ins Formular.
3. Formular: Ort (Pflicht), Location, Show (Select → Farbe). „Speichern" ist deaktiviert,
   solange kein Punkt gesetzt **und** kein Ort eingetragen ist.
4. Danach: Tabelle „Gepflegte Standorte" mit Farbpunkt, Ort · Location, Koordinaten,
   Termin-Anzahl und Löschen. Bestandsdaten aus Supabase sind nicht löschbar.

Datenmodell im Zielprojekt — neue Tabelle statt Stadtnamens-Matching:

```sql
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  venue text not null default 'Location folgt',
  lat  double precision not null,
  lng  double precision not null,
  created_at timestamptz not null default now()
);
alter table public.events add column venue_id uuid references public.venues(id);
```

Damit entfällt `coordsForCity()` / `CITY_COORDS` aus `lib/nrw-geo.ts` (Teilstring-Matching
auf Stadtnamen — heute die Fehlerquelle, wenn ein Ort nicht in der Liste steht).
`projectGeo`, `NRW_OUTLINE_POINTS` und `CITY_COORDS` können nach der Migration entfallen.
Im Prototyp liegen angelegte Orte in `localStorage` unter `sv-nrw-locations` — im Projekt
ersetzt das die `venues`-Tabelle + Server Action + `revalidate`.

---

## Seiten → Quelldateien im Zielprojekt

| Design-Datei | Route | Zu ändern |
|---|---|---|
| `Design System.dc.html` | – | `app/globals.css` (Referenz für alle Tokens) |
| `01 Startseite.dc.html` | `/` | `app/page.tsx`, `components/home/HeroScrollExperience.tsx`, `components/Buzzer.tsx`, `components/EventGrid.tsx`, `components/AppearancesSection.tsx`, `components/HomeGallery.tsx`, `components/CaptainVideo.tsx`, `components/YoutubeGallery.tsx` |
| `02 Shows.dc.html` | `/shows` | `app/shows/page.tsx`, `components/shows/TermineSection.tsx`, `components/Calendar.tsx`, `components/EventGallery.tsx`, `components/shows/NRWMap.tsx` |
| `03 Show-Detail.dc.html` | `/shows/[slug]` | `app/shows/[slug]/page.tsx`, `components/shows/ShowGalleries.tsx`, `components/shows/ShowUpcomingEvents.tsx`, `components/SocialLinks.tsx` |
| `04 Steffen.dc.html` | `/steffen` | `app/steffen/page.tsx`, `components/CaptainVideo.tsx` |
| `05 Kontakt.dc.html` | `/kontakt` | `app/kontakt/page.tsx`, `components/ContactForm.tsx` |
| `06 Angebote.dc.html` | `/angebote` | `app/angebote/page.tsx` |
| `07 Galerie.dc.html` | `/galerie` | `app/galerie/page.tsx`, `components/GalleryFilter.tsx`, `components/Lightbox.tsx` |
| `08 Rechtliches.dc.html` | `/impressum`, `/datenschutz`, `/agb` | `components/LegalPageView.tsx`, `lib/markdown.ts` |
| `09 404 und Consent.dc.html` | `/not-found` | `app/not-found.tsx`, `components/consent/CookieBanner.tsx` |
| `10 Mission Control Admin.dc.html` | `/admin/*` | `app/admin/(dashboard)/**`, `components/admin/AdminSidebar.tsx`, `components/admin/LoginForm.tsx` |
| `nrw-karte.html` | – | Vorlage für `components/shows/NRWMap.tsx` |

Show-Detailseiten sind identisch aufgebaut — nur `shows.color` unterscheidet sie, deshalb
liegt nur Brain Loading als Beispiel bei. Impressum/Datenschutz/AGB teilen ein Template
(`LegalPageView`); beide Zustände (mit Inhalt / leer) liegen in einer Datei.

---

## Design-Tokens (unverändert aus `app/globals.css`)

**Farben** — `--space #050711` · `--deep #0b1026` · `--text #f7f7ff` ·
`--muted rgba(247,247,255,.72)` · `--panel rgba(255,255,255,.08)` ·
`--panel2 rgba(255,255,255,.13)` · `--line rgba(255,255,255,.18)` ·
`--green #7CFF6B` (Brain Loading) · `--blue #42D9FF` · `--ice #AEEBFF` (Comedy Eiskalt) ·
`--purple #9B5CFF` · `--turq #5FF5E8` · `--orange #FF9F43` (Comedy Check-In) ·
`--yellow #FFD166` · `--pink #FF4FD8` · `--captain #1B4DFF` · `--danger #ff5577` ·
`--ok #77ffb7` · Gold-CTA `linear-gradient(135deg,#f5d68a,#e8a33d)`

**Typografie** — Display: Space Grotesk 700, `letter-spacing:-.075em … -.04em`,
`line-height:.93`. Body: Inter 400–950.
h1 `clamp(54px,9vw,132px)` · h2 `clamp(38px,6vw,84px)` · h3 `clamp(27px,3.6vw,52px)` ·
h4 `22px/1.08` · `.lead clamp(18px,2vw,24px)` · `p 17px/1.66` · Labels 13px/850 ·
Chips 850–950 · KPI `52px/1`

**Radien** — Pills `999px` · `--radius 30px` · Panels `34px` · Medien `22px` ·
Listen `18px` · Inputs `16px` · Show-Hero `44px` (A4-Cover `210/297`, `470px`)

**Schatten** — `--shadow 0 28px 90px rgba(0,0,0,.38)` ·
Karten-Hover `0 40px 90px rgba(0,0,0,.48), 0 0 50px rgba(66,217,255,.1)` ·
Nav-Glas `rgba(5,7,17,.75)` + `blur(18px)` ·
Gold-CTA `0 18px 44px rgba(232,163,61,.28)`

**Layout** — Container `min(1440px,100%)`, `padding-inline:clamp(18px,4vw,64px)` ·
Section `padding-block:clamp(62px,8vw,122px)` · Breakpoints 1050 / 900 / 820 / 680 px

## Assets

Aus `public/assets/media/` übernommen, im Zielprojekt bereits vorhanden — **nicht neu anlegen**:
`brand/logo_steffen.png`, `brand/steffen-vorholt-logo-primary.svg`,
`shows/*/‌*-planet.webp` (3×), `shows/brain-loading/brain-loading-hero.webp`,
`shows/brain-loading/brain-loading-card.webp`,
`steffen/steffen-hero-cutout.png`, `steffen/steffen-hero-right.png`,
`steffen/steffen-stage-loop-hero.mp4`.

## Beispieldaten

Alle Inhalte stammen aus `supabase/seed.sql` (3 Shows, 2 Termine, 5 One-Liner,
Impressum-Platzhalter). Zusätzliche Termine, Auftritte, Angebote, Comedians und Partner in
den Designs sind **Platzhalter** und müssen durch echte Supabase-Daten ersetzt werden.

## Offene Punkte vor Go-Live

- Impressum/Datenschutz/AGB-Platzhalter (`[Vor- und Nachname]` …) füllen — steht so heute live.
- `venues`-Migration + Server Action für den Karten-Admin.
- Echte Medien für alle schraffierten Platzhalter.
