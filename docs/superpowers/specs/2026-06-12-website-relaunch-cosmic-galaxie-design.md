# Website-Relaunch „Cosmic-Galaxie" + echtes Admin-Dashboard – Design Spec

**Datum:** 2026-06-12
**Ziel:** Die Steffen-Vorholt-Comedy-Website von einer statischen Vorlage zu einer hochwertigen, verspielten, SEO-optimierten Marketing-Website mit echtem, von Steffen selbst bedienbarem Admin-Dashboard (Supabase) ausbauen.
**Domain (final):** `steffenvorholt.de`

## Entscheidungen (mit User abgestimmt)

1. **Backend: Supabase** – Postgres + Auth + Storage. Änderungen sofort live ohne Redeploy.
2. **Auth:** E-Mail + Passwort (Supabase Auth). Zwei Accounts (Steffen + Lenny). Kein öffentliches Signup – Accounts werden manuell angelegt.
3. **Admin versteckt:** Kein Admin-Link in der öffentlichen Navigation. Zugriff nur direkt über `/admin` (Login-Seite).
4. **Anfragen:** Formulare schreiben in die DB (Dashboard-Inbox) UND lösen eine E-Mail-Benachrichtigung an Steffen aus (Resend).
5. **Shows sind vollständig dynamisch:** Steffen kann Shows anlegen/bearbeiten/löschen. Jede Show erzeugt automatisch ihre Unterseite unter `/shows/[slug]`. Pro Show: Texte, eigenes Planeten-Bild (Upload), Farbe, Termine.
6. **Seiten-Merges:**
   - „Termine" + „Kalender" → eine Seite **„Termine & Kalender"** unter `/termine` (erst Kalender, dann der komplette bisherige Termine-Inhalt).
   - „Booking" (`/steffen-buchen`) + „Comedians" (`/comedians-bewerben`) → eine Seite **„Kontakt & Bewerbung"** unter `/kontakt` mit zwei Bereichen.
7. **Archiv:** Seite wird gelöscht (301 → `/`). Stattdessen „Vergangene Missionen"-Galerie auf der Startseite, über das Dashboard pflegbar.
8. **Conversion-Ziel #1: Tickets verkaufen.** Startseite und alle Wege führen zum nächsten Termin + externem Ticketlink.
9. **Design-Richtung: „Cosmic-Galaxie"-Hybrid** – Cosmic-Premium-Basis (tiefer Raum, Glas, Gold, große Typo) + verspielte Comic-Schicht (Laufband, Sticker-Labels, Planeten mit Persönlichkeit). Per Browser-Mockup bestätigt.
10. **Planeten sind echte Bilder** (runde Grafiken, vom User vorhanden), pro Show über das Dashboard hochladbar.

## Öffentliche Seitenstruktur

**Navigation:** Home · Shows · Termine & Kalender (Ticket-Button-Style) · Kontakt & Bewerbung

| Route | Inhalt |
|---|---|
| `/` | Laufband (nächster Termin) → Hero mit Planeten-Cluster + Social-Proof-Zeile → Show-Karten (DB) → Nächste Termine (3, Ticket-CTAs) → Buzzer-Sektion → „Vergangene Missionen"-Galerie → Steffen-Sektion (Porträt + Bühnen-Video) → Footer |
| `/shows` | Übersicht aller aktiven Shows (DB) |
| `/shows/[slug]` | Dynamische Show-Seite: Planet, Tagline, Beschreibung, „Show-Prinzip"-Stichpunkte, Städte, kommende Termine der Show. Ersetzt alle 6 statischen Show-/Show-Termine-Seiten. |
| `/termine` | „Termine & Kalender": Kalender (Monatsraster, Events in Show-Farben) zuerst, darunter Filter-Chips + Terminliste mit Ticketlinks |
| `/kontakt` | „Kontakt & Bewerbung": Tab/Bereich 1 „Steffen buchen" (Veranstalter-Formular), Bereich 2 „Als Comedian bewerben" (Bewerbungs-Formular) |
| `/impressum` | Inhalt aus DB (von Steffen editierbar), noindex |
| `/datenschutz` | Bleibt statisch im Code, noindex |
| `/admin/*` | Dashboard (eigenes Layout, Auth-geschützt) |
| `/404` | Comedy-Bit („Diese Seite ist auf einem anderen Planeten gelandet") |

**301-Redirects** (in `next.config.ts`): `/kalender` → `/termine`, `/steffen-buchen` → `/kontakt`, `/comedians-bewerben` → `/kontakt`, `/archiv` → `/`, `/shows/*-termine` → `/shows/*`.

## Datenmodell (Supabase)

Tabellen (alle mit RLS: öffentlich lesen nur Veröffentlichtes; schreiben nur authentifizierte Admins):

- **shows** – `id`, `slug` (unique), `name`, `tagline`, `description` (Markdown), `format_label` (z. B. „Impro"), `color` (Hex), `planet_image_path` (Storage), `principle_items` (jsonb: Stichpunkte), `cities_text`, `sort_order`, `is_active`, `created_at`
- **events** – `id`, `show_id` (FK), `date`, `start_time`, `entry_time`, `city`, `venue`, `ticket_url`, `provider`, `is_published`, `created_at`. **Vergangenheit wird automatisch berechnet** (`date < heute`) – kein manuelles Archivieren.
- **inquiries** – `id`, `type` (`booking` | `comedian`), `name`, `email`, `phone` (optional), `message`, `status` (`new` | `read` | `answered`), `created_at`
- **gallery_items** – `id`, `image_path` (Storage), `caption`, `sort_order`, `created_at` (für „Vergangene Missionen")
- **one_liners** – `id`, `text`, `is_active` (für den Buzzer; von Steffen pflegbar)
- **legal_pages** – `id`, `slug` (`impressum`), `content` (Markdown), `updated_at`
- **site_media** – `id`, `key` (z. B. `hero_video`), `file_path` (Storage), `updated_at` (zentrale, austauschbare Medien)
- **Storage-Buckets:** `planets`, `gallery`, `media` (alle öffentlich lesbar)

Seed-Daten: die 3 bestehenden Shows inkl. vorhandener Planet-WebPs und der bestehenden Events aus `lib/events.ts`.

## Admin-Dashboard („Mission Control")

Eigenes Layout (kein öffentlicher Header/Footer), Login-Gate via Supabase Auth (`@supabase/ssr`, Middleware schützt `/admin/*`).

- **Übersicht:** echte KPIs – neue Anfragen, kommende Termine, Shows ohne kommenden Termin, Events ohne Ticketlink
- **Shows:** Liste + CRUD-Formulare. Planet-Upload (Bild-Preview), Farbe, alle Texte, aktiv/inaktiv. Löschen mit Bestätigung (Events der Show werden mitgelöscht – Hinweis im Dialog).
- **Termine:** Liste (kommend/vergangen getrennt) + CRUD. Pflichtfelder: Show, Datum, Stadt, Venue. Ticketlink optional (fehlend → KPI-Warnung + öffentlich „Tickets bald verfügbar").
- **Anfragen:** Inbox-Liste mit Typ-Filter und Status-Wechsel (neu/gelesen/beantwortet), Detail-Ansicht.
- **Galerie & Medien:** Bilder für „Vergangene Missionen" hochladen, Bildunterschrift, Reihenfolge ändern, löschen. Zusätzlich: Hero-Video austauschen (MP4-Upload in den `media`-Bucket).
- **One-Liner:** einfache Liste (Text + aktiv) für den Buzzer.
- **Impressum:** Markdown-Editor (Textarea + Vorschau).
- Mutationen via Server Actions; nach jedem Save `revalidatePath()` der betroffenen öffentlichen Seiten → **sofort live**.
- Der bisherige Mock-Punkt „GitHub-CMS" entfällt ersatzlos.

## E-Mail-Benachrichtigung

Resend (kostenloser Tier). Neue Anfrage → E-Mail an Steffen (+ Lenny optional CC) mit Inhalt + Link ins Dashboard. Setup-Schritt: Domain `steffenvorholt.de` bei Resend verifizieren; bis dahin Versand über Resend-Testabsender an die Entwickler-Adresse.

## Design-System „Cosmic-Galaxie"

- **Typografie:** Space Grotesk (Headlines, via `next/font/google`) + Inter (Text). Italic-Gradient-Akzente in Headlines.
- **Farben:** bestehende Neon-Palette bleibt; neu: Gold/Champagner (`#f5d68a → #e8a33d`) als Premium-CTA-Akzent. Show-Farben kommen dynamisch aus der DB (CSS-Variablen pro Show).
- **Bausteine:** Glas-Nav (sticky, blur), Termin-Laufband, Sticker-Labels (weiß, harte Farbschatten, leicht rotiert), Planeten-Bilder mit Glow + Orbit-Ringen, Karten mit Glas-Optik.

## Motion-Konzept

- **Dauerläufer (reines CSS):** Marquee-Laufband, mehrschichtiger Parallax-Sternenhimmel, Planeten-Float/-Rotation, gelegentliche Sternschnuppe, pulsierende Live-Dots.
- **Scroll-getriggert (Motion/framer-motion):** Sektions-Reveals, Counter (0→47 Shows), Hero-Headline Wort-für-Wort, Planeten-Parallax zur Mausposition.
- **Interaktiv:** Planeten-Wobble + Sticker-Pop beim Hover, Button-Wobble, Kalendertage mit Events pulsieren in Show-Farbe.
- **Buzzer (Comedy-Herzstück):** großer roter Buzzer auf der Startseite – Klick löst Konfetti + zufälligen One-Liner (aus DB) aus.
- `prefers-reduced-motion` wird respektiert (Dauerläufer aus, Reveals instant).

## Comedy-Layer (Microcopy)

Humor konsequent in Microcopy: 404-Seite, Formular-Validierungstexte, Button-Texte („Beam mich zur Show"), Footer-Gag, Empty-States („Keine Termine? Steffen schreibt gerade neue Witze."). Nie auf Kosten der Bedienbarkeit.

## SEO-Paket

- `metadata`-API: Title-Template (`%s – Steffen Vorholt Comedy`), Descriptions pro Seite, `metadataBase` = `https://steffenvorholt.de`, Canonicals.
- **JSON-LD:** `ComedyEvent` pro veröffentlichtem Termin (Name, Datum, Location, `offers` → Ticketlink), `Person` (Steffen Vorholt, Comedian), `BreadcrumbList` auf Show-Seiten.
- `sitemap.ts` (dynamisch: statische Routen + aktive Shows), `robots.ts`.
- OG-Images pro Show via `next/og` (Planet + Showname + Farbe); statisches Default-OG-Image für die übrigen Seiten.
- Performance: `next/image` für alle Bilder (inkl. Supabase-Storage-URLs via `remotePatterns`), Lazy Loading, selbst gehostete Fonts.
- `impressum`/`datenschutz` bleiben noindex.

## Benötigte Assets (liefert der Kunde)

1. Planeten-Bild pro Show – rund, transparent, min. 800×800 (vorhanden)
2. Steffen-Porträt (Hero/Über-Sektion), idealerweise freigestellt – 1×
3. Bühnenfotos quer, min. 1600px – 2–3×
4. Fotos vergangener Shows („Vergangene Missionen") – 6–12×
5. Kurze Bühnen-Clips MP4 10–30 s – 3–6× (optional; Hero-Video vorhanden)
6. Pressestimmen/Venue-Logos – optional

Bis dahin: stilechte Platzhalter; alles später über das Dashboard austauschbar.

## Tech-Stack & Architektur

- Next.js 16 App Router (bestehend), TypeScript, React 19
- `@supabase/supabase-js` + `@supabase/ssr` (Server Components lesen, Server Actions schreiben, Middleware für `/admin`)
- Rendering: öffentliche Seiten statisch mit **On-Demand-Revalidation** (`revalidatePath` nach Admin-Mutationen); zusätzlich `revalidate`-Intervall (z. B. 1 h) als Fallback, damit „vergangen/kommend" auch ohne Admin-Aktivität aktuell bleibt
- Motion (framer-motion) für Scroll-/Interaktions-Animationen, CSS für Dauerläufer
- Resend für E-Mails
- Env-Variablen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nur Server), `RESEND_API_KEY`, `NOTIFICATION_EMAIL`
- `lib/events.ts` entfällt nach Migration der Daten in Supabase (Seed-Skript)

## Tests / Verifikation

- `npm run build` fehlerfrei (alle Routen)
- Bestehender Media-Test (`tests/media-integration.test.mjs`) wird ersetzt durch: Smoke-Tests für Datenzugriffs-Helfer (Events-Sortierung kommend/vergangen, Show-Slug-Auflösung) und Schema-Validierung der JSON-LD-Generierung
- Manuelle Verifikation: Admin-Flow komplett (Show anlegen → Unterseite live, Termin anlegen → Kalender, Anfrage senden → Inbox + Mail), Lighthouse-Check (Performance/SEO ≥ 90), `prefers-reduced-motion`-Check

## Umsetzungs-Phasen (für den Implementierungsplan)

1. **Fundament:** Supabase-Projekt, Schema + RLS + Storage, Seed der Bestandsdaten, Datenzugriffs-Layer
2. **Struktur-Umbau:** Seiten-Merges (`/termine`, `/kontakt`), Archiv löschen, Redirects, Nav, dynamische `/shows/[slug]`
3. **Admin-Dashboard:** Auth + alle Verwaltungsbereiche + Revalidation
4. **Formulare + E-Mail:** echte Submits, Inbox, Resend
5. **Redesign „Cosmic-Galaxie":** Design-System, Motion, Buzzer, Comedy-Microcopy, neue Startseite
6. **SEO-Finish:** JSON-LD, Sitemap, OG-Images, Performance-Pass

## Nicht im Scope (spätere Schritte)

- Eigener Ticketverkauf/Checkout
- Newsletter, Mehrsprachigkeit
- Editierbarkeit der Datenschutzerklärung und der Startseiten-Texte (außer Galerie/One-Liner/Hero-Video) – Texte der Startseite bleiben im Code
