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
| Öffentliche Seiten | `app/` (`shows`, `kontakt`, `galerie`, `angebote`, `steffen`, …) |
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

## Hero-Bewegung (seit 29.07.2026)

Das Orbital-System im Hero ist **scrollgebunden**, nicht mehr dauerrotierend. Ein einzelner
rAF-Tick in `HeroScrollExperience.tsx` schreibt `transform` direkt auf `.hero-system`,
`.hero-carrier` und `.hero-planet-inner` — kein React-State pro Frame und **kein
`ScrollTrigger` mit `pin`+`scrub`** (das ruckelte durch Canvas-Repaint hinter dem
`backdrop-filter`-Nav, Commit 502c497). Der Entrance bleibt `useGSAP` + `gsap.matchMedia`;
der Loop startet erst in dessen `onComplete`, weil beide auf dasselbe `transform` schreiben.
Die CSS-Werte von `--start` in `globals.css` müssen zu `ORBITS[…].start` in der Komponente
passen, sonst springt das System beim ersten Tick. Bahnbewegung nur Desktop, bei
`prefers-reduced-motion` läuft der Loop gar nicht.

**Reihenfolge im `.hero-pin-block`:** Hero (sticky) → `.hero-trailer` → `.home-shows-pin`.
Jedes Element schiebt sich per `margin-top:-64px` + `z-index:2` über das vorige. Wer dort
etwas einfügt, muss das mitdenken: Bedienelemente in den unteren 64px eines dieser Blöcke
werden vom nächsten überdeckt und schlucken keine Klicks mehr (deshalb sitzt
`.hero-trailer-controls` auf `bottom:calc(64px + …)`).

## Trailer unter dem Hero (seit 29.07.2026)

`components/home/HeroTrailer.tsx` — vollflächiges Video aus
`public/assets/media/steffen/steffen-trailer.mp4` (6,5 MB, 1920×1080, 60 s). Liegt bewusst
**nicht** in Supabase Storage, sondern statisch bei Vercel: kein Supabase-Egress, immutable
gecacht. Startet stumm (alles andere blockieren Browser beim Autoplay), Ton per Schalter.

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
