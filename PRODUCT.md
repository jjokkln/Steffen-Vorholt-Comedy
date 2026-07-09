# Product

## Register

brand

## Users

- **Comedy-Publikum in NRW** (20–45): sucht Termine und Tickets für Stand-up-/Impro-Abende, entscheidet spontan am Handy.
- **Veranstalter, Firmen, Event-Planer**: prüfen, ob Steffen als Host/Comedian für Galas, Firmenfeiern und Events taugt → Booking-Anfrage.
- **Comedians**: wollen sich für Open-Mic-Slots (Comedy Eiskalt) bewerben.

## Product Purpose

Marketing-Website für Comedian Steffen Vorholt („Comedy aus einer anderen Galaxie"). Drei eigene Show-Formate (Doppelt verarscht!, Brain Loading, Comedy Eiskalt) werden als eigene Planeten eines Comedy-Universums inszeniert. Erfolg = Ticketklicks, Booking-Anfragen, Comedian-Bewerbungen. Inhalte kommen aus einem Supabase-Admin-Dashboard.

## Brand Personality

Verspielt, kosmisch, energiegeladen. Die Galaxie ist keine Deko, sondern die Bühne: Planeten sind Shows, Steffen ist der Captain. Humor darf sichtbar sein (Buzzer, One-Liner, Sticker), aber die Ausführung ist hochwertig — eher Pixar-Weltraum als Clipart-Sterne.

## Anti-references

- Generische Comedian-Onepager (Foto + Terminliste + Kontaktformular).
- SaaS-Landing-Ästhetik (Hero-Metric-Template, identische Kartenraster, Eyebrow über jeder Section).
- Billige Space-Klischees: Clipart-Raketen, Lens-Flares, überdrehtes Neon ohne Tiefe.
- Steifes Corporate — die Seite darf niemals nach Agentur-Baukasten aussehen.

## Design Principles

1. **Die Galaxie ist die Bühne.** Weltraum-Motiv trägt die Marke durch: Hintergrund mit echter Tiefe, Planeten als Navigation, kosmische Farbwelt (Violett/Blau/Pink auf Space-Schwarz).
2. **Motion mit Dramaturgie, nicht Deko.** Choreografierte Sequenzen (GSAP/Three.js) statt uniformer Fade-ins auf jeder Section. Jede Bewegung erzählt: Ankunft, Orbit, Landung.
3. **Progressive Enhancement.** Ohne JS/WebGL bleibt eine vollwertige statische Komposition. Canvas ist immer nur Verstärkung, nie Voraussetzung.
4. **Performance ist Teil der Qualität.** Lighthouse Performance/SEO ≥ 90, DPR-Caps, Renderloop pausiert unsichtbar, `prefers-reduced-motion` deaktiviert alles Dauerhafte.
5. **Semantik bleibt HTML.** Texte, Links, CTAs sind echtes DOM in Tab-Reihenfolge; Canvas und Partikel sind `aria-hidden`.

## Accessibility & Inclusion

- `prefers-reduced-motion: reduce` schaltet sämtliche Dauer- und Scroll-Animationen ab (statischer Endzustand, kein WebGL-Loop).
- Alle Inhalte ohne JavaScript im servergerenderten HTML sichtbar.
- Dekoratives (Canvas, Partikel, Orbits) `aria-hidden="true"`, fängt keine Pointer-Events.
- Kontrast auf dunklem Grund: Fließtext ≥ 4.5:1 (–-text #f7f7ff / --muted rgba ≥ .72 auf #050711).
