# Handoff: Website-Redesign „Cosmic Comedy Universe" (Steffen Vorholt)

## Überblick
Komplettes Redesign-Konzept für die Website von Steffen Vorholt (Comedian). Zeigt alle sechs Seiten des bestehenden Next.js-Projekts (`steffen-vorholt`) in einer neuen visuellen Sprache: jede der drei Comedy-Shows wird als eigener „Planet" mit eigener Farbe dargestellt, dazu kommen mehrere interaktive Bausteine (Live-Buzzer, NRW-Sternenkarte, Kalender-Umschalter, Scroll-Parallax-Hero).

## Wichtiger Hinweis zu den Design-Dateien
Die beigefügte Datei **`Website Redesign.dc.html`** ist ein **Design-Referenzdokument**, gebaut in HTML/CSS/React (als sog. "Design Component") — **kein Produktionscode zum direkten Kopieren**. Sie dient als pixelgenaue Vorlage für Layout, Farben, Typografie und Interaktionsverhalten.

**Aufgabe:** Dieses Design in der bestehenden Next.js-Codebasis (`steffen-vorholt`, App Router, `app/globals.css`, Komponenten unter `components/`) nachbauen — unter Wiederverwendung der bestehenden Datenanbindung (Supabase: `shows`, `events`, `appearances` etc.) und bestehender Komponenten (`Nav.tsx`, `Footer.tsx`, `EventCard.tsx` …), nicht das HTML 1:1 einfügen.

## Fidelity
**High-Fidelity.** Alle Farben, Radien, Abstände und Typografie-Werte unten sind final gemeint und sollten pixelgenau übernommen werden. Freitexte/Beispieldaten (Kalendertermine, Gastauftritte, Ticket-Preise) sind Platzhalter und müssen durch echte Daten aus Supabase ersetzt werden.

## Design-Tokens

### Farben
- Grundflächen (Verlauf, je nach Seite leicht variiert): `#02030a`, `#04050c`, `#05060f`, `#070a1e`, `#081226`, `#0a0620`, `#120a20`
- Text: `#f7f7ff` (primär), `rgba(247,247,255,.6–.74)` (gedämpft)
- Rahmen: `rgba(255,255,255,.14–.2)`
- Neon-Akzente (pro Show/Kategorie):
  - Grün `#7CFF6B` (Brain Loading / Impro)
  - Blau/Ice `#42D9FF`, `#AEEBFF` (Comedy Eiskalt / Open Mic)
  - Violett `#9B5CFF`
  - Pink `#FF4FD8`
  - Orange `#FF9F43`, Gelb `#FFD166` (Comedy Check-In / Boarding)
  - Türkis `#5FF5E8`, Captain-Blau `#1B4DFF`
- Gold-CTA (einziger "lauter" Call-to-Action, sparsam einsetzen): linear-gradient 135°, `#f5d68a → #e8a33d`
- Spektrum-Verlauf für Headlines (Textverlauf, `background-clip:text`): `#7CFF6B → #42D9FF → #FF9F43 → #FF4FD8`, 100° Winkel

### Typografie
- Headlines: **Space Grotesk**, Weight 700, `letter-spacing:-0.055em bis -0.075em`, `line-height:0.9–0.98`
- Fließtext: **Inter**, Weight 400–900
- Skala: H1 40–104px (responsive via `clamp()`), H2 32–58px, H3 24–40px, Lead 17–24px, Body 13–17px

### Radien & Schatten
- Pills/Buttons/Chips: `border-radius:999px`
- Große Karten/Panels: `border-radius:26–34px`
- Kleinere Karten: `18–22px`
- Inputs: `14–16px`
- Karten-Schatten: `0 28px 80–90px rgba(0,0,0,.38–.4)`
- Glasflächen: `linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.03–.04))` auf dunklem Grund, 1px Rahmen `rgba(255,255,255,.14–.18)`

### Assets
- Logo: `assets/logo.png` (aus `public/assets/media/brand/logo_steffen.png` im Originalprojekt) — im echten Projekt vorhanden, nicht neu anlegen.
- Alle Foto-/Video-Flächen im Redesign sind **Platzhalter** (schraffierte Muster) — echtes Bild-/Videomaterial muss noch geliefert/eingebunden werden.

## Seiten / Screens

### 1. Startseite (`/`)
- **Nav** (sticky/glass): Logo + 5 Links + goldener „Tickets"-Button.
- **One-Liner-Ticker**: horizontal laufendes Textband mit echten Pointen, endlos-Loop via CSS-Animation (`translateX(-50%)`, Inhalt doppelt im DOM für nahtlose Schleife).
- **Hero**: 2-spaltig. Links Headline + Subline + 2 CTAs + Stat-Reihe (47 Shows / 7 Locations / 6 Städte — durch echte Zahlen ersetzen). Rechts eine „Planeten-Bühne": 3 schwebende Planeten (je Show eine Farbe/Größe, `@keyframes float` sanftes Auf-und-Ab + leichte Rotation, Orbit-Ring als dünne Ellipse dahinter) plus ein eigenständiger Astronaut-Nav-Chip („Über Steffen" → `/steffen`), unten links positioniert, klar von den Planeten getrennt.
  - **Wichtige Interaktion — Scroll-Parallax:** Der Hero ist innerhalb eines eigenen scrollbaren Viewports (`overflow-y:auto`, feste Höhe) `position:sticky; top:0` gesetzt. Die direkt folgende Sektion „Wähl deine Mission" hat `margin-top:-64px`, abgerundete Oberkante (`border-radius:40px 40px 0 0`), einen sichtbaren "Griff"-Balken oben (56×5px, abgerundet, halbtransparent weiß) und einen Schlagschatten nach oben (`box-shadow:0 -70px 130px rgba(0,0,0,.65)`), sodass sie beim Herunterscrollen wie eine Karte über den Hero hochzieht. **Wichtig:** Hero + diese Sektion müssen gemeinsam in einem eigenen Block-Container gekapselt sein (nicht der gesamte Scroll-Container), damit der Hero sich nach der Übergabe wieder normal löst und nicht permanent kleben bleibt und spätere Sektionen durchscheinen. Zusätzlich: beim Scrollen wird der Hero per Scroll-Progress (0–1, gemessen über ~380px Scrolldistanz) leicht skaliert (bis `scale(0.9)`), nach oben verschoben (`translateY(-46px)`) und abgedunkelt (`filter:brightness(0.55)`) — für einen „aggressiveren", kinoartigen Übergang.
- **„Wähl deine Mission"**: 3 Show-Karten (Brain Loading / Comedy Eiskalt / Comedy Check-In), je mit Planeten-Icon, 2 Badges (Name + Format), Titel, Kurztext, „Show öffnen"-Button (führt zu `/shows/[slug]`) + „Tickets"-Button.
- **Live-Buzzer**: großer roter Button (radial-gradient rot, 3D-Effekt via `box-shadow` als „Sockel", drückt sich beim Klick nach unten). Klick ersetzt einen Text darunter durch eine zufällige Pointe aus einer festen Liste (5 Beispiele im Prototyp — echte Pointen-Liste vom Kunden einholen).
- **Footer**: Logo + Name, Social-/Rechtslinks.

### 2. Shows (`/shows`)
- Gleiche Nav.
- Hero-Text + **Umschalter** (Pill-Toggle) zwischen zwei Ansichten:
  - **Kalender**: Monatsraster (7 Spalten), Termine als kleine Badges mit farbigem linken Rand (Show-Farbe) innerhalb der Tageszelle.
  - **NRW-Sternenkarte**: SVG-Umriss von Nordrhein-Westfalen (Pfad im Prototyp enthalten), Städte als leuchtende „Planeten"-Punkte an ungefähr echten geografischen Positionen (Oberhausen, Bochum, Dortmund, Neuss, Köln, Bergisch Gladbach), mit pulsierendem Halo (SVG-Kreis, `opacity`+`scale`-Animation), gestrichelten „Sternbild"-Linien zwischen benachbarten Städten, plus eine Detail-Spalte rechts (ausgewählter Ort + nächste 2 Termine).
  - Umschalten aktuell rein client-seitig (State); im echten Projekt sollte die Auswahl ggf. in der URL (`?view=karte`) gespiegelt werden.
- Footer-Hinweis: Ticket-Flow-Erklärung (Ticket → Termin → externer Anbieter).

### 3. Steffen (`/steffen`)
- Hero: Text links („Der Captain", Headline, Bio, Stat-Reihe, 2 CTAs), **breites Querformat-Video-Slot rechts** (`aspect-ratio:16/10`, aktuell Platzhalter für `steffen-stage-loop-hero.mp4`), Spalten-Verhältnis `.9fr / 1.1fr` (Video bekommt mehr Raum als Text).
- **Partner-Leiste** „Spielt auch bei Komiker 11" (Glasfläche, 2 Link-Chips: Website/Instagram).
- **Neue Sektion „Wo Steffen selbst auf der Bühne steht"** (Gastauftritte): 3 Karten mit Kategorie-Badge (Open Mic / Gastauftritt / Gig — Farbcodiert), Titel, Datum, Ort, „Mehr Infos →"-Link. Entspricht 1:1 dem bestehenden Datenmodell `appearances` (Felder: `kind`, `title`, `date`, `venue`/`organizer`, `city`, `url`) — sollte an echte Supabase-Daten gebunden werden (aktuell 3 Platzhalter-Einträge).
- **Formate-Mini-Grid**: 3 kleine Karten (eine pro Show) mit Planeten-Icon + Kurzbeschreibung.

### 4. Booking & Kontakt (`/kontakt`)
- Zentrierter Hero-Text.
- 3 Formular-Karten nebeneinander, farblich unterschieden (Grün/Gold/Blau): „Eine Show buchen", „Steffen buchen", „Frage & Feedback" — je mit Icon, Kurzbeschreibung, Eingabefeldern (Platzhalter-Zustand im Prototyp, echte `<input>`/`<textarea>`/`<select>` im Code), Submit-Button, Ziel-E-Mail-Adresse als Kommentar unter dem Formular (`comedyshows@gmail.com`, `comedybooking@gmail.com`).

### 5. Angebote (`/angebote`)
- 2 Aktions-Karten nebeneinander (Bild-Platzhalter oben, Badge, Titel, Text, Code-Chip, Gültigkeit, CTA „Zur Aktion").

### 6. Galerie & Gästebuch (`/galerie`)
- Filter-Chips (Alle/Steffen/Shows/Locations).
- 4-spaltiges Foto-Raster, Bilder leicht rotiert (`-1deg/1deg`), beim Hover gerade drehend + leicht vergrößernd.
- **Gästebuch**: 3 Comedian-Karten (Foto-Platzhalter, Name, Kurztext, Social-Links) — Comedians, die bei Steffens Shows aufgetreten sind (nicht zu verwechseln mit Steffens eigenen Gastauftritten auf Seite 3).

## Interaktionen & Verhalten (Zusammenfassung)
- **Live-Buzzer**: Klick → zufällige Pointe aus Liste, kein Zurücksetzen nötig (State bleibt bis nächster Klick).
- **Kalender ⇄ Karte**: einfacher Zwei-Zustands-Toggle (Client-State).
- **Scroll-Parallax Hero**: siehe Startseite oben — sticky + scroll-progress-getriebene `transform`/`filter`-Anpassung (per `ref`, direkte DOM-Style-Mutation im Scroll-Handler, kein Re-Render pro Scroll-Tick — Performance-Empfehlung für den Reimplementierung in React beibehalten, z. B. via `useRef` + `onScroll`, nicht `useState`).
- **Hover-States**: Karten heben sich leicht an (`translateY(-8px)`), Buttons leicht heller.
- Alle Übergänge einfache CSS-`transition`/`animation`, keine externen Animationsbibliotheken nötig.

## Dateien
- `Website Redesign.dc.html` — vollständiges Referenzdesign, alle 6 Seiten als eigenständige Blöcke im Quellcode (Kommentare `<!-- ==== N · NAME ==== -->` markieren die Seitengrenzen). Enthält alle finalen Inline-Styles (Farben, Maße, Radien) im Klartext — am besten direkt im Editor durchsuchen statt neu zu vermessen.
