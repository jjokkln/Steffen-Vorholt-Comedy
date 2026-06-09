# Steffen Vorholt – Finaler Multi-Page HTML Blueprint

Das ist kein Onepager und keine reine Kunden-Demo, sondern ein echter statischer Seiten-Blueprint für die finale Website-Struktur.

## Start
Öffne `index.html`.

## Seiten
- `index.html`
- `shows/index.html`
- `shows/brain-loading.html`
- `shows/comedy-eiskalt.html`
- `shows/comedy-check-in.html`
- `termine.html`
- `archiv.html`
- `comedians-bewerben.html`
- `steffen-buchen.html`
- `admin/index.html`
- `admin/shows.html`
- `admin/termine.html`
- `admin/kalender.html`
- `admin/anfragen.html`
- `admin/cms.html`

## Assets
- CSS: `assets/css/styles.css`
- JS: `assets/js/main.js`
- Daten: `assets/data/events.json`
- Medienstruktur: `assets/media/...`
- Medienliste: `docs/media-manifest.md`

## Neu ergänzt: öffentliche Kalender-/Buchungslogik

- `kalender.html` = Gesamtübersicht für alle Shows
- `shows/brain-loading-termine.html` = Brain-Loading-Termine
- `shows/comedy-eiskalt-termine.html` = Comedy-Eiskalt-Termine
- `shows/comedy-check-in-termine.html` = Comedy-Check-In-Termine

Die Kalenderdaten liegen aktuell statisch in `assets/js/main.js` und zusätzlich als Struktur in `assets/data/events.json`.
Im echten Build werden diese Daten aus Supabase geladen.
