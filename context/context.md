# Repo-Kontext: steffen-vorholt

Marketing-Website + Admin-Dashboard („Mission Control") für den Comedian Steffen Vorholt.
Verbindliche Projektregeln stehen in [CLAUDE.md](../CLAUDE.md), der Relaunch-Plan in [docs/superpowers/](../docs/superpowers/).

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · **plain CSS** (`app/globals.css`, kein Tailwind) ·
Supabase (EU/Frankfurt, Ref `insyjxxpeywehwnoazjr`) · Nodemailer/SMTP · Vercel.
Middleware heißt `proxy.ts` im Repo-Root (Next 16) und schützt nur `/admin/*`.

## Wichtige Pfade

| Bereich | Ort |
|---|---|
| Öffentliche Seiten | `app/` (`shows`, `kontakt`, `galerie`, `steffen`, …) |
| Admin-Dashboard | `app/admin/(dashboard)/…`, Navigation in `components/admin/AdminSidebar.tsx` |
| Server Actions | `lib/actions/*.ts` |
| Supabase-Clients | `lib/supabase/{browser,server,public}.ts` — kein Service-Role-Client vorhanden |
| Migrationen | `supabase/migrations/NNNN_*.sql` (fortlaufend nummeriert) |
| Mails | `lib/email.ts`, `lib/email-templates/*.html`, `lib/notification-text.ts` |
| Tests | `tests/*.test.ts` (`npm test`, node:test mit Type-Stripping) |
| Hero-Copy Startseite | `components/home/HeroScrollExperience.tsx` (Begrüßungstext von Steffen, Stand 28.07.2026); Typo-Variante `.is-welcome` in `app/globals.css` |
| NRW-Karte | `components/shows/NRWMap.tsx` (nur `dynamic`-Wrapper) → `NRWMapClient.tsx`; Helfer `lib/venue-helpers.ts` |

## NRW-Karte & Spielorte (seit 29.07.2026)

Die Karte auf `/shows` läuft über **Leaflet + OpenStreetMap-Tiles**, nicht mehr über das
9-Punkt-`<polygon>` aus dem gelöschten `lib/nrw-geo.ts`. Drei Regeln, die man kennen muss:

1. **Client-only.** Leaflet fasst beim Import `window` an. `components/shows/NRWMap.tsx` ist
   deshalb nur der `dynamic(..., { ssr:false })`-Wrapper; die Karte selbst steckt in
   `NRWMapClient.tsx`. `ssr:false` ist nur in Client Components erlaubt — der Wrapper muss
   `"use client"` bleiben.
2. **Attribution ist Pflicht.** „© OpenStreetMap contributors" ist Lizenzbedingung, nicht
   Deko. Der dunkle Marken-Look kommt aus dem CSS-Filter auf `.leaflet-tile-pane`, damit
   keine kostenpflichtigen Dark-Tiles nötig sind.
3. **Positionen kommen aus `venues`, nicht aus dem Stadtnamen.** Ein Termin ohne `venue_id`
   erscheint nicht auf der Karte — nur im Kalender und in der Terminliste. Orte werden unter
   `/admin/standorte` per Klick in die Karte angelegt (Server Action `lib/actions/venues.ts`),
   die Verknüpfung setzt das Feld „Spielort auf der Karte" im Termin-Formular. Markerfarbe:
   `venues.show_id` → Show des nächsten Termins → Fallback `--ice`.

Umsetzungsnotiz zum Design-Handoff: [docs/2026-07-29-handoff-cosmic-galaxie-umsetzung.md](../docs/2026-07-29-handoff-cosmic-galaxie-umsetzung.md).

### Mehrere Termine je Standort (seit 29.07.2026)

`/admin/standorte` startet direkt im Pflegemodus (`NRWMapClient`: `useState(admin ? "admin" : "besucher")`).
Jede Standort-Zeile hat „+ Termine" und klappt `components/admin/VenueEventsForm.tsx` auf:
Datumsliste per Einzelfeld **oder** Serie (`lib/bulk-dates.ts`, `seriesDates` — wöchentlich /
14-tägig / monatlich, gedeckelt auf 52), Uhrzeiten/Ticketlink/Status gelten für alle Termine
der Serie. Server Action `createVenueEvents` in `lib/actions/events.ts`.

Drei Punkte, die man kennen muss:
1. **Stadt und Location kommen aus dem Standort**, nicht aus dem Formular — genau das
   Abtippen war der Zeitfresser, und so kann city/venue nicht von der Karte abweichen.
2. **Dubletten werden übersprungen**, nicht abgelehnt: `events` hat keinen Unique-Index,
   ein zweiter Klick würde sonst alles doppelt anlegen. Die Meldung zählt die übersprungenen mit.
3. **Das Lösch-Formular des Standorts liegt in derselben Zeile** — das Termin-Formular muss
   deshalb Geschwister-Element von `.loc-row` bleiben (`<form>` in `<form>` ist ungültig).
   Deshalb der Wrapper `.loc-item`.

Die Datumsliste geht als **ein** kommasepariertes hidden field (`dates`) an die Action,
damit die Anzahl der Felder nicht am DOM hängt; geparst mit `parseDateList`.

## Termine-Ansicht auf Mobile (seit 29.07.2026)

`/shows#termine` (und der Kalender auf den Show-Detailseiten) hat drei Layout-Stufen, die man
nicht versehentlich wieder zusammenlegen sollte:

- **> 1050 px:** Monatsraster mit Termin-Pillen in den Zellen.
- **681–900 px:** dasselbe Raster, nur ohne die 90-px-Mindestbreite je Spalte (7 × 90 px passen
  bei 768 px nicht in den Container — genau das hat früher den Umbruch ausgelöst).
- **≤ 680 px:** Raster bleibt 7-spaltig, aber kompakt: Tageszahl + farbige Punkte je Show,
  Termintexte stehen in der Liste unter dem Raster (`.calendar-daylist`). Tap auf einen Tag
  filtert die Liste auf diesen Tag, „Ganzer Monat" setzt zurück.

Verantwortlich: `components/Calendar.tsx` + der Kalenderblock in `app/globals.css`. Wichtig:

1. **Nie wieder `grid-template-columns:1fr` fürs Monatsraster.** Aus 31 Tagen wurde eine
   Kolonne aus 42 leeren Kästen (~10 Wischer bis zum ersten Termin).
2. **`.calendar-cell-number` ist ein `<button>`** — auf Desktop per `pointer-events:none` reine
   Anzeige, auf Mobile das Tages-Auswahlziel. Termin-Links bleiben Geschwister, nicht Kinder
   (kein `<a>` im `<button>`).
3. **Startmonat** kommt aus `startMonth()`: laufender Monat, wenn dort etwas gespielt wird,
   sonst der Monat des nächsten Termins. Ohne das landet man im leeren Juli, obwohl die
   nächste Show im September ist. Rechnet nur aus Props → keine Hydration-Diskrepanz.
4. **Terminliste lädt portionsweise** (`EventGallery`, `PAGE_SIZE = 9` + „weitere anzeigen“).
   77 Termine als Karten waren auf dem Handy ~20.000 px Scroll.
5. **Karte:** Startausschnitt sind die Spielorte (`homeBounds`), nicht ganz NRW — alle Orte
   liegen an der Rhein-Ruhr-Achse. Unter 820 px sind zusätzlich die `.pin-label` aus, weil
   Neuss/Dormagen/Leverkusen/Bergisch Gladbach sonst zu einem Textklumpen verschmelzen; der
   Ortsname steht im Chip-Band, im Popup und in der Ergebnisliste.

## Angebote gehören zur Show (seit 30.07.2026)

Die frühere eigene Seite `/angebote` **und** der Admin-Bereich `/admin/angebote` sind
entfallen. `offers` hat jetzt `show_id` (Migration `0016_offers_pro_show.sql`, `on delete
cascade`):

- **Pflege:** aufklappbare Sektion „Angebote & Promo-Codes" in `/admin/shows/<id>` —
  Anlege-Formular plus je Angebot ein verschachteltes `<details>` mit
  `components/admin/OfferForm.tsx` (Actions `createShowOffer` / `updateOffer` /
  `deleteOffer`, alle mit `showId` für `revalidatePath`).
- **Öffentlich:** Sektion `#angebote` auf `/shows/<slug>`, direkt über den Terminen —
  `components/shows/ShowOffers.tsx`, Daten via `getOffersForShowId`. Code ist per Klick
  kopierbar (`navigator.clipboard`), eingelöst wird er beim Ticketanbieter.
- **Bildformat wählbar** wie in den Galerien (`FLEXIBLE_ASPECT_OPTIONS`). Das Bild liegt
  *hinter* dem Inhalt: die Kachel übernimmt das Seitenverhältnis des Bildes (beim Laden
  gelernt, wie in `StorageImage`), damit der Zuschnitt aus dem Admin nicht erneut
  beschnitten wird. Hochformate bekommen über `data-orientation="portrait"` eine schmalere
  Kachel, sonst werden sie bildschirmhoch.
- **Altbestand:** Angebote mit `show_id IS NULL` stammen aus der alten Seite und erscheinen
  nirgends mehr — bei Bedarf einer Show zuordnen oder löschen.

## Hero-Motiv „der Mond" (seit 29.07.2026)

Im Hero steht **ein** Key Visual: `.hero-moon` mit
`public/assets/media/brand/steffens-comedyuniversum.webp` (Steffen + alle drei
Show-Planeten in einer Kugel). Es hat das frühere Orbital-System aus drei Einzelplaneten
**und** das Freisteller-Foto (`.hero-captain`) ersetzt; `components/home/hero-types.ts` ist
damit entfallen, `app/page.tsx` baut keine `heroPlanets` mehr. Rechts zentriert, auf Mobile
im normalen Fluss unter der Copy (das alte Foto war dort `display:none`).

Beim Scrollen wächst der Mond auf ~3× und wandert nach unten, sodass seine Oberkante als
Horizont über der hochziehenden Trailer-Sektion steht. Getrieben von **einem** rAF-Tick mit
direkter Style-Mutation — kein React-State pro Frame und **kein `ScrollTrigger` mit
`pin`+`scrub`** (das ruckelte durch Canvas-Repaint hinter dem `backdrop-filter`-Nav, Commit
502c497). Der Entrance bleibt `useGSAP` + `gsap.matchMedia`; der Loop startet erst in dessen
`onComplete`, weil beide auf dasselbe `transform` schreiben. Alle Kennzahlen stehen im
`CAMERA`-Objekt der Komponente (`grow`/`rise`/`driftX`/`fade`, getrennt für Desktop/Mobile).

⚠️ **Nicht per `translate`/`transform` zentrieren.** GSAP setzt beim Entrance-Tween
`translate:none` (es normalisiert die Einzel-Transform-Properties), und eine
`translate:0 -50%`-Zentrierung kippt dabei weg — der Mond hing so 300 px zu tief. `.hero-moon`
zentriert deshalb über `top:0;bottom:0;margin-block:auto` + fester `height`. Dieselbe Falle
stand schon im Kommentar des alten Orbit-CSS.

`prefers-reduced-motion`: kein Loop, der Mond steht in Ruhegröße.

**Reihenfolge im `.hero-pin-block`:** Hero (sticky) → `.hero-trailer` → `.home-shows-pin`.
Jedes Element schiebt sich per `margin-top:-64px` + `z-index:2` über das vorige. Wer dort
etwas einfügt, muss das mitdenken: Bedienelemente in den unteren 64px eines dieser Blöcke
werden vom nächsten überdeckt und schlucken keine Klicks mehr (deshalb sitzt
`.hero-trailer-controls` auf `bottom:calc(64px + …)`).

## Trailer unter dem Hero (seit 29.07.2026)

`components/home/HeroTrailer.tsx` — vollflächiges Video. `src`/`poster` kommen seit dem
30.07.2026 als Props aus den Medien-Plätzen (siehe „Medienverwaltung im Admin"); solange
niemand etwas hochgeladen hat, greift die mitgelieferte Datei
`public/assets/media/steffen/steffen-trailer.mp4` (6,5 MB, 1920×1080, 60 s). Startet stumm
(alles andere blockieren Browser beim Autoplay), Ton per Schalter.

**Egress-Abwägung:** Die mitgelieferte Datei liegt statisch bei Vercel — kein Supabase-Egress.
Ein im Admin hochgeladener Trailer liegt dagegen in Supabase Storage und zählt bei jedem
Abspielen auf das Egress-Kontingent. Deshalb ist die Vorab-Komprimierung kein Kosmetikthema:
1,5 MB statt 6,5 MB sind der Unterschied zwischen ~3.400 und ~800 Abspielvorgängen pro Monat
im Free-Kontingent. Wer eine Dauer-Lösung ohne Egress will, legt die Datei weiter in `public/`
ab und lässt den Platz im Admin leer.

Der Start hängt an einem `IntersectionObserver`, nicht am `autoPlay`-Attribut: sonst zieht
jeder Startseiten-Aufruf 6,5 MB, auch wenn niemand so weit scrollt. Wer selbst pausiert,
bekommt das Video nicht wieder automatisch angeworfen (`pausedByUser`), und vollständig
außerhalb des Bildes pausiert es (sonst läuft der Ton weiter, während man liest).

**Hero-Headline-Falle:** Die Zeilen der Hero-Headline stecken in `.hero-line-mask`
(`overflow:hidden` für den GSAP-Reveal) und sind `width:max-content`. Bricht eine Zeile um,
wird die zweite Zeile unsichtbar weggeschnitten. Bei Textänderungen deshalb die Schriftgröße
gegen die längste Zeile prüfen (Variante `.hero-scroll-title.is-welcome` bindet die Größe auf
Mobile per `min(7.1vw,27px)` an die Viewport-Breite). Der Marken-Claim „Comedy aus einer
anderen Galaxie" lebt weiter in `<title>`/OG-Image (`lib/ogImage.tsx`), nicht mehr im `h1`.

## Social-Media-Abschnitt auf /galerie (seit 30.07.2026)

Tabelle `social_media_items` (Migration 0016), Admin unter `/admin/social`, öffentlich
`components/SocialMediaSection.tsx`. Details und offene Punkte:
[docs/2026-07-30-social-media-abschnitt.md](../docs/2026-07-30-social-media-abschnitt.md).
Vier Dinge, die man kennen muss:

1. **Plattformen stehen im Code, nicht in der DB.** `SOCIAL_PLATFORMS` in
   [lib/social.ts](../lib/social.ts) hält Label, Markenfarbe, Icon-Schlüssel, Embed-Regel und
   den datenschutzrechtlichen Empfänger. `platform` ist deshalb bewusst eine freie
   `text`-Spalte **ohne** CHECK — eine neue Plattform ist ein Frontend-Commit, keine
   Migration, und unbekannte Werte fallen auf das Website-Icon zurück (`socialPlatform()`
   gibt nie `undefined`).
2. **Einbetten ≠ verlinken.** Nur YouTube, Instagram, TikTok und Facebook haben eine
   Embed-Funktion; alles andere (und jede Profil-URL statt Beitrags-URL, und
   `vm.tiktok.com`-Kurzlinks) wird als Kachel verlinkt. `socialEmbedUrl()` gibt dafür `null`
   zurück — Kanäle grundsätzlich, auch bei einbettbarer Plattform.
3. **Consent-Version steht auf 2.** Die neuen Empfänger (Meta, TikTok) waren von der
   YouTube-Einwilligung nicht gedeckt, deshalb der Versionssprung in
   `CookieConsentProvider` + neuer Banner-Text. Kommt eine weitere Plattform mit Embed dazu:
   wieder hochzählen und den Banner ergänzen. Die Datenschutzerklärung liegt in der DB und
   muss von Hand mitziehen (Textvorschlag steht im Doc).
4. **Icons sind Inline-SVG** in `components/SocialIcon.tsx` — keine Icon-Bibliothek, keine
   Bilddateien, `currentColor`. Neue Plattform = Glyphe dort ergänzen, sonst greift der
   Website-Globus.

Ohne sichtbaren Eintrag rendert `SocialMediaSection` `null`, der Abschnitt verschwindet also
komplett. Fehlt die Tabelle (Migration noch nicht eingespielt), fängt
`getActiveSocialMediaItems` `PGRST205` ab — die Seite bleibt heil.

`lib/social.ts` importiert `./youtube.ts` **relativ und mit Endung**: `npm test` läuft über
`node --test` mit Type-Stripping und kennt den `@/`-Alias nicht. Dafür steht jetzt
`allowImportingTsExtensions` in der `tsconfig.json` — das räumt gleich die neun TS5097-Fehler
weg, die alle Test-Dateien bisher produziert haben.

## Tonalität der Website-Texte

Seit dem Copy-Update vom 28.07.2026 sprechen Startseite und `/steffen` in der **Ich-Form**
(„Hier siehst du mich als Nächstes", „Schau dir die Shows in Ruhe an") — vorher dritte Person
(„Wo Steffen selbst auf der Bühne steht"). Emojis sind erwünscht, aber sparsam: eins pro Absatz,
nie im `<h1>`/`<h2>`. Die Raumfahrt-Metaphern werden schrittweise abgebaut: „Der Captain" ist raus,
„Wähl deine Mission" und „Vergangene Missionen" stehen noch. Neue Texte nicht in der dritten
Person schreiben — sonst kollidieren sie mit dem Hero.

## Datenfluss Anfragen

`components/ContactForm.tsx` → `lib/actions/submit-inquiry.ts` → Insert in `inquiries`
(anon-Client, RLS erlaubt nur INSERT) → parallel zwei Mails:

1. **Bestätigung an den Anfragenden** — HTML-Template je Formulartyp + Plaintext-Alternative.
2. **Benachrichtigung an Steffen** — reiner Plaintext mit allen Formularfeldern.

Empfängeradressen kommen aus `site_settings` (Keys `notify_email_*`) und werden im Dashboard
unter `/admin/einstellungen` gepflegt. Fallback-Kette: DB → Env (`EMAIL_SHOWS`/`EMAIL_BOOKING`)
→ im Code hinterlegte Adressen. Mailversand ist immer best-effort: Fehler werden geloggt,
die Anfrage ist zu dem Zeitpunkt längst gespeichert.

## Bild-Auslieferung (Egress-Regel)

**Kein rohes `<img src={mediaUrl(...)}>` mehr.** Jedes Bild aus dem Storage läuft über
`next/image`, sonst zieht jeder Seitenaufruf das Original (bis 7 MB) direkt aus Supabase — genau
das hatte das Cached-Egress-Kontingent gesprengt (Ursachen → [troubleshooting.md](./troubleshooting.md)).
Drei Bausteine:

| Fall | Werkzeug |
|---|---|
| Container hat schon `position:relative` + Seitenverhältnis | `<Image fill sizes=… />` direkt |
| Layout aus dem Bild heraus (feste Höhe, Breite variabel) | `components/media/StorageImage.tsx` — lernt das Verhältnis beim Laden |
| Logo im 52-px-Rahmen | `components/BrandLogo.tsx` |

Pflichtregeln: **`sizes` immer angeben** (ohne nimmt next/image 100vw an und liefert die
1920-px-Variante), Videos bekommen `preload={poster ? "none" : "metadata"}`, und Uploads laufen
über `lib/upload.ts` (setzt `cacheControl: 31536000`, unbedenklich wegen unveränderlicher
Dateinamen). `next.config.ts` hält `minimumCacheTTL` auf 31 Tage und die Breiten-Varianten klein —
jede Variante ist ein eigener Abruf beim Storage.

## Medienverwaltung im Admin (seit 30.07.2026)

Vorher gab es genau **ein** Video-Feld („Hero-Video") auf der Galerie-Seite, dessen Datei an
zwei verschiedenen Stellen ausgespielt wurde, während der Trailer gar nicht pflegbar war.
Jetzt: `/admin/medien` („Videos & Speicher") mit einem Upload-Feld pro Platz.

- **Registry `lib/site-media.ts`** — eine Zeile pro Platz (Schlüssel, Beschriftung, „wo
  erscheint das", Zielgröße/-bitrate, Fallback-Kette). Neuer Platz = Eintrag hier + Migration
  für den Startwert + `resolveSiteMedia()` an der Zielstelle. Frei von Server-Code, damit auch
  Client-Komponenten die Liste importieren können.
- **Fallback-Kette** (`resolveSiteMedia`): eigener Wert → `fallbackKey` → … → `localFallback`
  aus `public/`. Lokale Reserven greifen erst am Ende der Kette, sonst würde ein leerer Platz
  den historischen Schlüssel `hero_video` überspringen (Migration 0016 hat ihn zu
  `home_portrait_video` umbenannt). Getestet in `tests/site-media.test.ts`.
- **Plätze:** `home_trailer_video`, `home_trailer_poster`, `home_portrait_video`,
  `steffen_portrait_video` (leer = erbt das Video der Startseite).
- **Aufräumen:** `lib/actions/site-media.ts` löscht beim Ersetzen die vorherige Datei aus dem
  Storage — aber nur, wenn kein anderer Datensatz (`site_media`, `gallery_items`,
  `show_videos`, `show_images`) noch auf sie zeigt. Bei endlichem Kontingent wäre die
  Alternative, dass jeder Austausch dauerhaft Altlast liegen lässt.

**Komprimierung vor dem Upload:** `lib/video-compress.ts`, ohne jede Dependency — Video
abspielen, Frames verkleinert auf ein Canvas zeichnen, Canvas-Stream plus Tonspur (über
Web-Audio, damit die Vorschau lautlos bleibt) per `MediaRecorder` neu kodieren. Kein
ffmpeg.wasm, weil das `SharedArrayBuffer` und damit COOP/COEP für die ganze Domain bräuchte
(würde YouTube-Embeds und Leaflet zerschießen). Läuft in Echtzeit, Tab muss offen bleiben.
Gemessen am 30.07.2026 in Chrome: 11,8 MB / 1080p / 12 Mbit/s → **1,48 MB** bei 1280×720 als
MP4/H.264 (−87 %). Jeder Fehlschlag lädt still das Original hoch — Komprimieren ist eine
Optimierung, kein Tor, an dem ein Upload scheitern darf.

**Speicher-Anzeige:** `lib/storage-usage.ts` summiert die Storage-Objekte pro Bucket über die
Storage-API (`storage.objects` liegt nicht im PostgREST-Schema). Kompakte Leiste in der
Topbar auf jeder Admin-Seite (`components/admin/StorageUsageBar.tsx`, lädt über
`/api/admin/storage-usage` nach dem Rendern, damit nichts blockiert — die Route prüft `auth.getUser()`
selbst, weil `proxy.ts` nur `/admin/:path*` abdeckt), ausführliche Tabelle auf `/admin/medien`.
Das Kontingent steht in `STORAGE_QUOTA_GB` (Standard 5). **Achtung:** Der Supabase-Free-Plan
enthält 1 GB Datei-Storage; die 5 GB sind das monatliche Egress-Kontingent.

## Rechtstexte (Impressum, Datenschutz, AGB)

Alle drei stehen in `legal_pages` (Spalte `content`) und werden im Dashboard unter
`/admin/rechtliches/<slug>` gepflegt. Eine Liste definiert alles: [lib/legal.ts](../lib/legal.ts)
speist öffentliche Route, Metadaten, Sidebar, Fußbereich, Consent-Ausnahmen und die
Slug-Prüfung in `saveLegalPage`. Gerendert wird über `components/LegalPageView.tsx` mit der
Markdown-Teilmenge aus [lib/markdown.ts](../lib/markdown.ts) (`##`/`###`, Absätze, `-`/`1.`-Listen,
`**fett**`, `*kursiv*`, `[Text](URL)`; HTML wird immer escapet). Neue Rechtsseite = Eintrag in
`lib/legal.ts` + Zeile in `legal_pages` + `app/<slug>/page.tsx`. Alle drei sind `robots: index:false`
und stehen bewusst **nicht** in der `sitemap.ts`.

⚠️ Der AGB-Text ist ein **ungeprüfter Entwurf** (erste Zeile sagt das auch dem Leser) — vor der
Bewerbung der Seite juristisch prüfen lassen.

## RLS-Konvention

Pro Tabelle eine öffentliche Lese-/Insert-Policy plus `admin all <tabelle>` für `authenticated`
(Single-Admin-Setup: eingeloggt = Steffen). Bei `site_settings` sind bewusst **nur** Keys mit
Prefix `notify_email_` anon-lesbar — der öffentliche Formular-Submit braucht sie ohne Session.

## Domain & Deployment

Vercel. Kanonisch ist **`https://www.steffenvorholt.de`**, die Apex-Domain leitet per 308 um.
DNS-Zone und Postfächer liegen bei Strato. Zustellbarkeit → [docs/2026-07-26-email-zustellbarkeit.md](../docs/2026-07-26-email-zustellbarkeit.md).
