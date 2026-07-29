# Umsetzung Design-Handoff „Cosmic-Galaxie" (29.07.2026)

Quelle: `design_handoff_cosmic_galaxie/README.md` (Ordner bleibt im Repo).
Alle vier Aufgaben abgearbeitet, je ein Commit. Build und `npm test` (42 Tests) nach jedem
Schritt grün.

## 1. Pillen brechen nicht mehr um

`app/globals.css`: gemeinsamer `white-space:nowrap`-Block für `.chip`, `.badge`, `.status`,
`.navlinks a`, `.sidebar a`, `.social-chip`, `.offer-badge`, `.appearance-kind.badge`,
`.yt-placeholder-btn`, `.consent-btn`, `.map-results-count`, `.loc-badge`. `.btn` hatte die
Regel schon. Die bisherigen Einzelfälle in Media-Queries (`.sidebar a`,
`.map-city-rail .chip`) sind entfallen, weil die Basisregel sie abdeckt.

## 2. Video-Platzhalter-Label unter dem Play-Badge

Regel aus dem Handoff übernommen (`.media-placeholder>span`,
`.show-media-item .media-thumb figcaption` → `align-self:end;padding-bottom:22px`).

**Offen / zur Info:** In der heutigen DOM greift keiner der beiden Selektoren.
`.media-placeholder` enthält nur einen Textknoten („Bühnen-Video folgt", `app/page.tsx`,
`app/steffen/page.tsx`) und kein Play-Badge, und die `figcaption` der Video-Kachel liegt
neben `.media-thumb`, nicht darin (`components/shows/ShowGalleries.tsx`,
`ShowMediaGallery.tsx`). Der beschriebene Überdeckungs-Bug existiert im Programm also nicht;
die Regel ist als Vorsorge drin und wirkt, sobald der Platzhalter ein Badge bekommt oder die
Bildunterschrift in den Thumb wandert. Wenn das nicht gewollt ist, können die zwei Zeilen
raus.

## 3. Scrollgebundener Hero

`components/home/HeroScrollExperience.tsx` + `.hero-*` in `app/globals.css`.

- `@keyframes orbit-spin` / `orbit-hold` und die `--period`-Variablen sind weg,
  `planet-float` bleibt.
- Neue Werte laut Handoff: System `min(74vh,46vw,760px)`, `top:37%`,
  `transform-origin:62% 46%`, `z-index:3` (über dem Scrim), Planeten 40/29/23 %,
  Bahn-Tops 28/33/9 %, Carrier-`z-index` 3/2/1, Glow 46 px (Hover 76 px).
- Bewegung: ein rAF-Tick mit direkter Style-Mutation über `useRef`, kein React-State pro
  Frame und kein `ScrollTrigger` mit `pin`+`scrub` (Begründung siehe Kommentar in der Datei
  und Commit 502c497). Entrance bleibt `useGSAP` + `gsap.matchMedia`.
- `.hero-orbit` ist entfallen: die Ringe waren seit dem Kundenwunsch „keine sichtbaren
  Bahnen" unsichtbar und dienten nur noch als Layout-Anker für `--orbit-r`. Mit festen
  Bahn-Tops braucht es sie nicht mehr, entsprechend ist auch ihr Entrance-Tween raus.
- Der Loop startet erst im `onComplete` des Entrance-Tweens — beide schreiben auf
  `transform` von `[data-hero-planet]` und würden sich sonst gegenseitig überschreiben.
- **Nebenbefund, mitbehoben:** Der Maus-Parallax war tot. `context.add(fn)` führt `fn`
  sofort aus (GSAP-Context-API), der `pointermove`-Listener wurde also direkt nach dem
  Registrieren wieder abgemeldet. Der Parallax läuft jetzt im selben rAF-Tick mit — zwei
  Schreiber auf einem `transform` würden sich sonst plattmachen.
- `prefers-reduced-motion`: der Loop startet nicht. Damit keine Leerlauf-Schwingung und kein
  Kamera-Zoom; die Planeten stehen auf den CSS-Ruhewinkeln.
- **Entscheidung über den Handoff hinaus:** Die Bahnbewegung läuft nur auf Desktop. Mobil
  beginnt `.hero-pin-block` am Seitenkopf, der Sweep wäre also längst durchgelaufen, bevor
  das System unter der Copy überhaupt in Sicht kommt — alle drei Planeten klumpten an einem
  Punkt (per Screenshot verifiziert). Mobil bleibt die Ruhekomposition stehen, `planet-float`
  läuft weiter.

## 4. Echte NRW-Karte statt 9-Punkt-Polygon

- `lib/nrw-geo.ts` gelöscht (`projectGeo`, `NRW_OUTLINE_POINTS`, `CITY_COORDS`,
  `coordsForCity`). Einziger Verwender war `NRWMap`; kein Test hing daran.
- `supabase/migrations/0015_venues.sql` — `venues` + `events.venue_id` + RLS analog
  `0001_init.sql` (`public read venues`, `admin all venues`). **In `insyjxxpeywehwnoazjr`
  angewendet.** `get_advisors` bringt für `venues` nur die gleiche
  `rls_policy_always_true`-Warnung, die alle 17 anderen Tabellen schon haben
  (Single-Admin-Konvention, siehe `context/context.md`) — keine neue Klasse von Finding.
- **Abweichung vom Handoff-SQL:** zusätzliche Spalte `show_id` in `venues`. Der Handoff will
  ein Show-Select im Formular („Show (Select → Farbe)") und Marker in `shows.color`, sein
  SQL hat aber keine Farbspalte — ein frisch angelegter Ort hat noch keinen Termin, aus dem
  sich die Farbe ableiten ließe. Ohne die Spalte wäre das Select ein Bedienelement ohne
  Wirkung. Farbreihenfolge jetzt: `venue.show_id` → Show des nächsten Termins → Fallback
  `--ice`. Ebenfalls ergänzt: `on delete set null` auf beiden Fremdschlüsseln und ein Index
  auf `events.venue_id`.
- `lib/venue-helpers.ts` (rein, mit Tests in `tests/venue-helpers.test.ts`):
  `buildVenueMarkers`, `constellationLinks`, `roundCoord`, `isInNrw`, `NRW_BOUNDS`.
  Sternbild-Linien entfernen Doppelkanten — bei zwei Orten, die sich gegenseitig am nächsten
  liegen, läge die Linie sonst zweimal übereinander und wäre doppelt so dunkel wie alle
  anderen (der Prototyp macht das nicht).
- `lib/actions/venues.ts` — `createVenue` / `deleteVenue`, beide mit eigenem
  `auth.getUser()` (Middleware allein reicht nicht), danach `revalidatePublic()` +
  `revalidatePath("/admin/standorte")`. Löschen verweigert, solange Termine am Ort hängen.
- `components/shows/NRWMap.tsx` ist jetzt nur noch der `dynamic(..., { ssr:false })`-Wrapper
  (Leaflet fasst `window` beim Import an, und `ssr:false` ist nur in Client Components
  erlaubt). Die Karte selbst: `components/shows/NRWMapClient.tsx`.
- Pakete: `leaflet@1.9.4` (Version aus dem Handoff), `react-leaflet@5`, `@types/leaflet`.
  `leaflet/dist/leaflet.css` wird in `NRWMapClient.tsx` importiert. Die
  `integrity`-Hashes aus dem Handoff gehören zum CDN-Weg der Prototyp-HTML und entfallen
  auf dem npm-Weg.
- Karten-Setup wie im Handoff: `maxBounds` NRW `.pad(0.35)`, `maxBoundsViscosity:.75`,
  `minZoom:6`, `maxZoom:15`, `zoomSnap:.25`, `scrollWheelZoom:false` (erst nach Klick),
  Zoom-Control unten rechts. Dunkler Look über den CSS-Filter auf `.leaflet-tile-pane`.
  **Attribution „© OpenStreetMap contributors" ist Lizenzbedingung und bleibt.**
- Marker als `L.divIcon`: Punkt in Show-Farbe, Halo nur bei Orten mit Termin, 15 px mit /
  11 px ohne Termin, Ortsname als Label darunter, Termin-Anzahl im Punkt ab 2 Terminen.
  Der `markerScale`-Parameter aus dem Prototyp ist ein URL-Knopf der Vorschau und nicht
  übernommen.
- Seitenspalte: Chip-Rail (Alle Orte + je Ort mit Farbpunkt) → `.map-results-head` (Eyebrow
  = Location, H2 = Stadt, Count-Pille) → Terminkarten. Für die Karten wird der bestehende
  `EventCard` weiterverwendet statt der kompakten `.ev`-Karte aus dem Prototyp — sonst gäbe
  es zwei Darstellungen für Ticketlink, Status-Pille und Datums-Box.
- Admin-Modus: `NRWMap` bekommt `admin`. Öffentlich (`/shows`) ist der Umschalter nicht
  vorhanden, im neuen Dashboard-Punkt **Programm → Standorte** (`/admin/standorte`) schon.
  Damit hängt der Schreibzugriff am bestehenden `/admin/*`-Schutz in `proxy.ts` plus RLS.
- **Über den Handoff hinaus:** Das Termin-Formular (`components/admin/EventForm.tsx`) hat
  jetzt ein Select „Spielort auf der Karte" und `lib/actions/events.ts` schreibt `venue_id`.
  Ohne das gäbe es keinen Weg, `venue_id` zu setzen, und die öffentliche Karte bliebe
  dauerhaft leer.
- **Nebenbefund, mitbehoben:** `.btn` hatte keinen `:disabled`-Zustand — „Standort
  speichern" sah voll aktiv aus, obwohl es gesperrt war. `.btn:disabled{opacity:.42}`
  ergänzt, `:hover` auf `:not(:disabled)` eingeschränkt. Außerdem sperrt das Formular jetzt
  während `pending`: in der Tabelle stehen zwei „Wuppertal" 0,8 s auseinander, also ein
  Doppel-Submit aus einem Live-Test.

## Verifikation

Playwright (Chromium aus dem npx-Cache, `chromium_headless_shell-1194`), keine
Konsolenfehler:

- Hero bei Scroll 0 / 310 / 620 px, dazu Mobile (390×844) und
  `prefers-reduced-motion: reduce`.
- Karte in Besucher- und Admin-Modus über eine temporäre Prüfseite mit Beispieldaten
  (danach entfernt, **keine Testdaten in Supabase geschrieben**): 5 Pins, 4 Halos (Köln ohne
  Termin bleibt ohne), 4 Sternbild-Linien für 5 Orte, 16 Tiles geladen, Filter aktiv,
  Attribution vorhanden. Chip-Klick → `flyTo` + gespiegelte Auswahl. Klick in die Karte im
  Admin-Modus → weißer Entwurfs-Marker + Koordinaten auf 4 Dezimalen. „Speichern" gesperrt
  ohne Ort, frei mit Ort.

## Was offen bleibt

- **Bestehende 80 Termine haben `venue_id = null`** und erscheinen deshalb noch nicht auf
  der Karte. Sie müssen einmalig im Termin-Formular einem Spielort zugeordnet werden
  (10 Städte: Bergisch Gladbach, Essen, Neuss, Oberhausen, Duisburg, Bonn, Leverkusen,
  Dormagen, Köln, Dortmund).
- Die 6 vorhandenen `venues`-Zeilen (Düsseldorf, Köln, Wuppertal ×2, Mönchengladbach, Bonn)
  haben `show_id = null` und `venue = "Location folgt"`, laufen also in der Fallback-Farbe.
  Eine der beiden Wuppertal-Zeilen ist der Doppel-Submit von oben und kann weg.
- `/admin/standorte` wurde **nicht** eingeloggt per Browser geprüft (keine Zugangsdaten in
  dieser Session) — die Admin-Oberfläche ist über die Prüfseite verifiziert, nicht über die
  echte Route.
- Aus dem Handoff nicht angefasst, weil nicht Teil der vier Aufgaben: die Seiten-Details aus
  der Tabelle „Seiten → Quelldateien", die Rechtstext-Platzhalter und die echten Medien für
  die schraffierten Platzhalter.
