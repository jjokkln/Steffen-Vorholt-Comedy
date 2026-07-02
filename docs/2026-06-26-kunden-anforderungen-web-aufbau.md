# Kunden-Anforderungen „Web-Aufbau" (Steffen Vorholt)

> **Quelle:** `web-aufbau.pdf` (1 große Skizze-/Sitemap-Seite, erstellt vom Kunden in einem Freeform-/Whiteboard-Tool, 26.06.2026). Notizzettel + Screenshots seiner Show-Poster + Pfeile, die die Navigationsflüsse zeigen.
>
> **Zweck dieser Datei:** Alle Vorhaben des Kunden festhalten und Schritt für Schritt abarbeiten. Status pro Punkt mit Checkbox. Abgleich mit dem aktuellen Projektstand steht jeweils dabei (✅ vorhanden / ✏️ ändern / 🆕 neu).
>
> Bezieht sich auf den laufenden Relaunch „Cosmic-Galaxie" (`docs/superpowers/plans/2026-06-12-relaunch-00-uebersicht.md`).

---

## 1. Navigation (Hauptleiste) — Ziel: 6 Punkte

Der Kunde zeichnet eine Hauptleiste mit genau diesen Menüpunkten:

1. **Startseite**
2. **Shows**
3. **Steffen** (Über mich)
4. **Booking, Kontakt**
5. **Angebote**
6. **Galerie und Gästebuch (Comedians)**

**Abgleich aktueller Stand** (`components/Nav.tsx`): heute *Home · Comedian · Shows · Termine & Kalender · Kontakt & Bewerbung*.

- [ ] ✏️ ändern Nav auf die 6 Zielpunkte umbauen
- [ ] ✏️ ändern „Comedian" → in **Steffen** (Über mich) umbenennen/umbauen
- [ ] ✏️ ändern „Termine & Kalender" als eigenständigen Punkt entfernen → wandert **in die Shows-Seite** (Kalender- + Kartenansicht, siehe §3)
- [ ] 🆕 Menüpunkt **Angebote** (siehe §6)
- [ ] 🆕 Menüpunkt **Galerie und Gästebuch** (siehe §7)

---

## 2. Startseite (Scroll-Erlebnis von oben nach unten)

Der Kunde beschreibt die Startseite als langes Scroll-Erlebnis. Reihenfolge laut Skizze:

### 2.1 Hero — Planeten + Astronaut (interaktiv)
- **ENTSCHEIDUNG (Kunde, 26.06.):** Planeten **reaktivieren** (nicht Portrait-Fotos).
- [ ] ✏️ ändern Hero-Planeten wieder **einblenden** (aktuell ausgeblendet in `app/page.tsx:44-50`).
- [ ] ✏️ ändern **Planeten anklickbar** → führen zu den **Erklärungen der jeweiligen Show** (`/shows/[slug]`)
- [ ] ✏️ ändern **Astronaut anklickbar** → führt zur **Steffen-Seite** (Über mich)

### 2.2 Hinweise direkt unter dem Hero
- [ ] 🆕 Hinweis: „Du kannst **mich und meine Shows buchen** (Video auf Anfrage), mir eine **Frage stellen** oder **Feedback** geben" → verlinkt auf die Kontakt-Formulare (§5)
- [ ] 🆕 Hinweis auf **aktuelle Aktionen** (z. B. Rettember, Missions Pass) → verlinkt auf Angebote (§6)

### 2.3 Über mich (kurz)
- [ ] ✏️ ändern Kurzer „Über mich"-Block (ausführliche Version auf der Steffen-Seite, §4)

### 2.4 Komiker 11
- [ ] 🆕 **Erwähnung „Komiker 11"** mit **Markierung/Link zu deren Webseite und Instagram**
  - (Komiker 11 = Gruppe/Veranstalter, bei der/dem Steffen als Comedian spielt.)

### 2.5 Kalender von Steffens eigenen Auftritten (als Comedian)
- [ ] 🆕 **Kalenderansicht mit Auftritten/Spielen** (u. a. Komiker 11) von Steffen **als Comedian**
  - Klick auf einen Termin → **direkt zum Link der Show**
  - Daten liegen bereits vor: Tabelle `appearances` + Admin (`/admin/auftritte`). Heute auf `/comedian` als Karten-Timeline (`app/comedian/page.tsx`). → als **Kalender** auf der Startseite aufbereiten.

### 2.6 Social Media + letzte Auftritte
- [ ] 🆕 **Hinweis Social Media**
- [ ] 🆕 **Letzte Auftritte um…** (jüngste vergangene Termine)
- [ ] 🆕 **Videos von Auftritten** — ausdrücklich „für alle, die kein Social Media haben"
  - Quelle: `youtube_videos` / `show_videos` (vorhanden). Eigener Abschnitt.

### 2.7 Call-to-Action + Aktions-Code
- **ENTSCHEIDUNG (Kunde, 26.06.):** Kein Code-/Codewort-Mechanismus. Nur ein **kleiner Hinweistext pro Show** (frei hinterlegbar), z. B. „Mit Code XY zahlst du nur 5 €". Keine tieferen Code-Änderungen.
- [ ] 🆕 **Beschreibung, die zum Kontakt-aufnehmen auffordert**
- [ ] ✏️ ändern Feld **Hinweistext/Aktions-Hinweis pro Show** an `shows` ergänzen + im Admin pflegbar + auf Show-Seite anzeigen. (Ersetzt „5 €-Code" und „4. Codewort" — keine eigene Mechanik.)

### 2.8 Kontaktformulare am Seitenende
- [ ] 🆕 Zwei Formulare am Fuß der Startseite:
  - → `Steffen.vorholt.comedyshows@gmail.com`
  - → `Steffen.vorholt.comedybooking@gmail.com`

---

## 3. Shows-Seite (mit Kalender- UND Kartenansicht)

Kern-Neuerung: Die Shows-Seite bekommt **zwei umschaltbare Ansichten**.

### 3.1 Show-Übersicht (Formate)
- [ ] ✅ Übersicht der Show-Formate als Karten — vorhanden (`app/shows/page.tsx`). Formate laut Skizze:
  - **Comedy Eiskalt** (Kürzel **CE**) — „Wer braucht schon das Eis!"
  - **Doppel Comedy** (Kürzel **DC**)
  - **Brain Loading (Comedy)** (Kürzel **BL**)
- [ ] ✅ Pro Show: Button **„Show öffnen"** + Button **„Tickets"** — vorhanden
- Flow Tickets: **Auf das Ticket klicken → einen Termin auswählen → Link zum Ticketanbieter**

### 3.2 🆕 Kalenderansicht
- [ ] Termine aller Shows als Kalender (Monatsansicht, vgl. Screenshot „Juni 2026").
- [ ] Filterbar nach Show (Brain Loading / Comedy Eiskalt / Doppel Comedy).
- Aktueller Stand: Kalender existiert bereits auf `/termine` (`components/Calendar.tsx`). → **in die Shows-Seite integrieren** (Termine-Seite auflösen, siehe §1).

### 3.3 🆕 Kartenansicht (NRW-Karte mit Planeten auf Städten)
- **ENTSCHEIDUNG (Kunde, 26.06.):** **HTML-Landkarte** bauen (NRW-Karte als HTML/SVG, keine externe Geo-/Karten-Bibliothek nötig).
- [ ] **HTML-/SVG-Karte von NRW** mit **Planeten auf den Städten**.
- [ ] **Klick auf einen Planeten/Stadt** → ausgewählte Stadt + **Termin-Übersicht** dieser Stadt.
- [ ] Städte laut Skizze u. a.: **Köln**, **Neuss** (Snowworld), **etc.** (Städte aus den `events`-Daten ableiten).
- [ ] Beispiele aus Skizze: „Brain Loading in Köln", „Comedy Eiskalt — Snowworld Neuss".
- [ ] Umschalter **Kalenderansicht ⇄ Kartenansicht** auf der Shows-Seite.
- Komplett neu (kein Kartenmodul vorhanden).

---

## 4. Steffen (Über mich)

- [ ] ✏️ ändern Ausführliche **„Über mich"-Seite** mit Foto + Bio.
- [ ] Ziel des Astronaut-Klicks aus dem Hero (§2.1).
- Aktueller Stand: Teile davon stecken in `/comedian`. → zu sauberer **Steffen-Seite** umbauen (Bio, Werdegang, Foto), Kollegen/Partner ggf. nach Galerie/Gästebuch verschieben.

---

## 5. Booking, Kontakt — 3 Formulare → 2 E-Mail-Adressen

Der Kunde will **drei getrennte Formulare**:

| Formular | Zweck | Ziel-E-Mail |
|---|---|---|
| **Booking Show** | Eine seiner Shows buchen | `Steffen.vorholt.comedyshows@gmail.com` |
| **Booking Steffen** | Steffen selbst (als Act/Mod) buchen | `Steffen.vorholt.comedybooking@gmail.com` |
| **Frage / Feedback** | Frage stellen oder Feedback geben | `Steffen.vorholt.comedyshows@gmail.com` |

- [ ] ✏️ ändern Heute 2 Formulare (`booking` / `comedian`, `app/kontakt/page.tsx`) → auf **3 Formulare** erweitern.
- [ ] 🆕 **Routing an 2 verschiedene Empfänger-Adressen** je nach Formular (heute geht alles an eine `NOTIFICATION_EMAIL`).
- [ ] „Video auf Anfrage" als Option/Hinweis im Booking-Formular.
- [ ] Bestätigung beim Kunden: Diese beiden Gmail-Adressen final?

---

## 6. Angebote (Aktuelle Aktionen)

- [ ] 🆕 Eigene Seite/Sektion **Angebote** für aktuelle Aktionen.
- [ ] Beispiele aus Skizze: **Rettember** (5 €-Eintritt-Aktion mit Code), **Missions Pass**.
- [ ] Pro Aktion: Titel, Bild/Poster, Beschreibung, Aktions-Code, Gültigkeit/Zeitraum.
- [ ] **Im Admin pflegbar** (Aktionen kommen und gehen).
- [ ] Verknüpfung mit dem Aktions-Code-/Codewort-Mechanismus der Startseite (§2.7).
- Komplett neu (neue Tabelle `offers`/`promotions` + Admin + Public-Seite).

---

## 7. Galerie und Gästebuch (Comedians)

### 7.1 Galerie
- [ ] ✏️ ändern **Galerie** mit Kategorien laut Skizze: **Steffen**, **Shows**, **Locations**.
- Aktueller Stand: Galerie existiert als Homepage-Sektion + Admin (`gallery`), aber **ohne Kategorien**. → Kategorie-Feld ergänzen + eigene Galerie-Seite.

### 7.2 Gästebuch (Comedians)
- [ ] ✏️ ändern **Gästebuch mit Comedians, die bei Steffen zu Gast waren**: pro Person **kurzer Text + Foto + Link zu Webseite oder Instagram**.
- Aktueller Stand: Tabelle `comedians` + Admin vorhanden, heute auf `/comedian` als „Comedy-Kollegen". → unter **Galerie und Gästebuch** zusammenführen/umbenennen.

---

## 8. Übergreifende Features / Mechaniken

- [ ] **Show-Kürzel** CE / DC / BL durchgängig (Tickets, Karte, Kalender). Ggf. Feld an `shows` ergänzen.
- [ ] **Ticket-Flow** überall gleich: Ticket klicken → Termin wählen → externer Ticketanbieter-Link.
- [ ] ~~Aktions-Code / Codewort-Mechanik~~ → vereinfacht: nur **Hinweistext-Feld pro Show** (§2.7), keine Mechanik.
- [ ] **Komiker 11** als verlinkter Partner (Webseite + Instagram).
- [ ] **2 E-Mail-Empfänger** (comedyshows@ / comedybooking@) sauber im Form-Backend abbilden.

---

## 9. Geklärte Fragen / noch offen

**Geklärt (Kunde, 26.06.):**
1. ✅ Hero: **Planeten reaktivieren** (keine Portrait-Fotos).
2. ✅ NRW-Karte: **als HTML-/SVG-Landkarte** bauen.
3. ✅ Aktions-Code: **nur kleiner Hinweistext pro Show**, keine Mechanik.

**Noch offen:**
4. **E-Mail-Adressen** final (`comedyshows@` / `comedybooking@`)?
5. **Galerie-Kategorien** (Steffen / Shows / Locations) final so?

---

## 10. Grobe Umsetzungsreihenfolge (Vorschlag)

1. **Navigation** auf 6 Zielpunkte umbauen (§1) + Routen-Gerüst (`/steffen`, `/angebote`, `/galerie`).
2. **Steffen-Seite** (§4) + **Galerie/Gästebuch** (§7) aus bestehendem `/comedian` herauslösen.
3. **Shows-Seite**: Termine integrieren → **Kalenderansicht** (§3.2) + Umschalter-Gerüst.
4. **Kartenansicht NRW** (§3.3) — größtes neues Modul.
5. **Kontakt**: 3 Formulare + 2-Empfänger-Routing (§5).
6. **Angebote** inkl. Schema + Admin (§6).
7. **Startseite**-Scrollblöcke nachziehen: Komiker 11, Auftritts-Kalender, Videos, Aktions-Hinweis (§2).
8. **Hinweistext-Feld pro Show** (§2.7) — kleines Feld an `shows` + Admin + Anzeige.

---

## 11. Umsetzungsstand — 26.06.2026 (Schritte 1–8 umgesetzt)

Alle 8 Schritte sind im Code umgesetzt; `npm run build` + `npm test` (20 Tests) laufen grün.

| Schritt | Status | Wichtigste Dateien |
|---|---|---|
| 1 Navigation + Routen | ✅ | `components/Nav.tsx`, `app/steffen|angebote|galerie/page.tsx`, `next.config.ts` (Redirects), `components/Footer.tsx`, `app/sitemap.ts` |
| 2 Steffen + Galerie/Gästebuch | ✅ | `app/steffen/page.tsx`, `app/galerie/page.tsx` (`/comedian` → Redirect auf `/steffen`) |
| 3 Shows: Kalender + Umschalter | ✅ | `app/shows/page.tsx`, `components/shows/TermineSection.tsx` (`/termine` → Redirect auf `/shows`) |
| 4 NRW-Karte | ✅ | `components/shows/NRWMap.tsx`, `lib/nrw-geo.ts` |
| 5 Kontakt: 3 Formulare → 2 Mails | ✅ | `app/kontakt/page.tsx`, `lib/email.ts`, `lib/actions/submit-inquiry.ts` |
| 6 Angebote | ✅ | `app/angebote/page.tsx`, `lib/actions/offers.ts`, `components/admin/OfferForm.tsx`, `app/admin/(dashboard)/angebote/*` |
| 7 Startseite-Blöcke | ✅ | `app/page.tsx` (Planeten reaktiviert + Hotspots), `components/home/HeroScrollExperience.tsx` |
| 8 Hinweistext pro Show | ✅ | `components/admin/ShowForm.tsx`, `lib/actions/shows.ts`, `app/shows/[slug]/page.tsx` |

### ⚠️ Noch anzuwenden: Supabase-Migrationen (MCP war offline)
Diese 4 Migrationen müssen eingespielt werden, sonst bleiben die betroffenen Features leer bzw. brechen:

- `supabase/migrations/0006_gallery_category.sql` — Galerie-Kategorien
- `supabase/migrations/0007_inquiry_types.sql` — **WICHTIG:** ohne diese schlägt das Absenden aller 3 Kontaktformulare fehl (Check-Constraint)
- `supabase/migrations/0008_offers.sql` — Angebote-Tabelle
- `supabase/migrations/0009_show_hint_text.sql` — Hinweistext-Spalte

Einspielen via Supabase-MCP `apply_migration` (sobald wieder verbunden) oder CLI/SQL-Editor. Vorher prüfen: Project-Ref = `insyjxxpeywehwnoazjr`.

### Offene Punkte / bewusste Entscheidungen
- **E-Mail-Adressen** (§9.4): Defaults `comedyshows@` / `comedybooking@` sind im Code hinterlegt, per Env `EMAIL_SHOWS` / `EMAIL_BOOKING` überschreibbar → vom Kunden bestätigen lassen.
- **Comedian-Bewerbung** entfällt (war im alten Formular, nicht in der Skizze). „Als Comedian bewerben"-Links zeigen jetzt auf Booking/Frage. Bei Bedarf wieder aufnehmen.
- **NRW-Karte** ist stilisiert (grobe Silhouette + reale Städtekoordinaten), bewusst keine exakte Geo-Karte. Städte werden aus den Termin-Daten abgeleitet; Koordinaten-Liste in `lib/nrw-geo.ts` erweiterbar.
- **Hero-Planeten** sind über ein Hotspot-Overlay klickbar (Planet → Show, Astronaut → /steffen). Astronaut ist aktuell ein Emoji-Icon; bei Wunsch durch echtes Astronaut-Asset ersetzen.
