# Troubleshooting

## E-Mail

**Bestätigungsmails landen beim Kunden im Spam.**
Ursache ist nicht fehlende Authentifizierung, sondern der Freemail-Absender (`@gmail.com`) bei
gleichzeitig markenbezogenem Inhalt (Links/Logo auf `steffenvorholt.de`). Vollständige Analyse
und der Umstellungsplan auf `@steffenvorholt.de` (Strato): [docs/2026-07-26-email-zustellbarkeit.md](../docs/2026-07-26-email-zustellbarkeit.md).
Kurz: erst SPF + DKIM auf der Domain, **dann** `EMAIL_FROM` umstellen — DMARC steht auf `p=reject`,
ohne SPF/DKIM würde Domain-Versand komplett abgelehnt.

**Steffen bekommt keine Benachrichtigung über eine neue Anfrage.**
Reihenfolge zum Prüfen:
1. `/admin/einstellungen` → „Versand-Status": stehen SMTP-Zugangsdaten in der Umgebung?
2. Dort „Testmail senden" — Fehlermeldung erscheint direkt im Formular.
3. Spam-Ordner der Empfängeradresse prüfen.
4. Vercel-Logs nach `[email]` durchsuchen (Versand ist best-effort, Fehler werden nur geloggt).

**Absender = Empfänger vermeiden.** Bei Gmail erscheint eine Mail, die das Konto an sich selbst
schickt, nur unter „Gesendet"/„Alle Nachrichten", nicht im Posteingang. `EMAIL_FROM` darf also
nicht in den `notify_email_*`-Adressen stehen.

**Mail-Links nie auf die Apex-Domain zeigen.** `steffenvorholt.de` antwortet mit 308 auf
`www.steffenvorholt.de`; Redirect-Ketten kosten Zustellbarkeit und brechen Bilder in manchen Clients.

**Bilder in Mails klein halten.** Das Website-Logo hat 849 KB — für Mails liegt eine 38-KB-Variante
unter `public/assets/media/brand/logo_steffen_mail.png`. Die Templates referenzieren die
*Live-URL*, neue Bilder wirken also erst nach dem Deploy.

## Build & Tests

**`Expected ',', got 'ident'` beim Build in einer deutschen Zeichenkette.**
Typografische Anführungszeichen: `„Text"` schließt mit einem geraden `"` und beendet damit den
String. Immer `„Text“` schreiben (oder in Template-Literals bleiben).

**`npm test` braucht die Dateiendung im Import.** Testdateien importieren `../lib/foo.ts`
*mit* `.ts`. Die dadurch früher entstandenen neun TS5097-Fehler sind erledigt, seit
`allowImportingTsExtensions` in der `tsconfig.json` steht — `tsc --noEmit` ist also **kein**
Rauschen mehr, sondern soll grün sein. Nur getestete Module dürfen keine Wert-Imports über den
`@/`-Alias haben (node löst den Alias nicht auf); `import type` ist unproblematisch, weil es
wegkompiliert wird.

**`tsc --noEmit` ist nicht Teil von `npm run build`.** Der Build hat einen eigenen, engeren
TypeScript-Lauf und war am 30.07.2026 grün, während `npx tsc --noEmit` zwei Fehler meldete
(TS2578, „Unused '@ts-expect-error' directive" in `tests/venue-helpers.test.ts:58` und `:67` —
die Testdaten passen inzwischen zum Typ, die Direktive ist überflüssig geworden). Wer nur den
Build prüft, sieht das nicht. Es gibt außerdem **kein `lint`-Skript und kein ESLint** im Repo;
`npm run build` + `npx tsc --noEmit` + `npm test` sind zusammen die Abnahme.

**Achtung beim parallelen `next dev`.** Läuft ein Dev-Server, bricht `npm run build` mit
„Another next build process is already running" ab — der Exit-Code ist dann 1, obwohl am Code
nichts falsch ist.

**Verzeichnis-Argument bei node:test.** `node --test tests/` funktioniert auf Node 24 nicht,
darum steht im `test`-Skript das Glob `"tests/**/*.test.*"`.

## Layout

**Headline klebt am rechten Rand.** `.section-head` ist `display:flex; justify-content:space-between`
und erwartet **zwei** Kinder: einen `<div>` mit Eyebrow + `<h2>` und daneben die Begleit-Copy.
Stehen Eyebrow und `<h2>` als direkte Kinder darin, wird die Headline nach rechts geschoben
(war so im Archiv-Block auf `/shows`). Immer beide in einen `<div>` wickeln — auch wenn es
rechts keinen Text gibt. Für zwei Absätze rechts: `<div className="section-head-copy">`, zweite
Zeile mit `className="kicker"` (eisblau, fett — dieselbe Behandlung wie `.hero-welcome-kicker`).

**Chips zweier Filtergruppen liegen übereinander (war so auf `/shows` unter 900 px).**
`display:grid` in einer Media-Query setzt `grid-template-columns` **nicht** zurück. `.event-filter-groups`
hatte deshalb auf dem Handy weiter die drei Desktop-Spalten (`auto .78fr 1.72fr`), und Show- und
Ort-Chips landeten sichtbar aufeinander. Beim Umstellen auf eine Spalte immer
`grid-template-columns` explizit überschreiben.

**`p` hat `white-space:pre-line`.** In JSX geschriebene Mehrzeiler sind unkritisch (JSX faltet
Zeilenumbrüche zu Leerzeichen), aber in Template-Literals und aus der DB gelesenen Texten wird
jeder `\n` zu einem echten Umbruch.

## Supabase-Egress

**„You have exceeded your Free Plan quota" / Cached Egress über 5 GB (28.07.2026).** Cached Egress
ist alles, was die Supabase-Smart-CDN aus dem Storage ausliefert — bei 142 MB Bestand kamen 5,5 GB
zustande. Vier Ursachen, alle behoben:

1. **Rohe `<img>`-Tags auf Storage-Originale.** Der schwerste Fall waren die drei Hero-Planeten
   in `HeroScrollExperience.tsx`: 2,4–4,7 MB PNG, `loading="eager"`, auf der Startseite. Das sind
   ~9 MB pro Besuch und erklärt die 5,5 GB fast allein. Dazu Show-Hintergrund als
   CSS-`background-image` (6 MB PNG pro Show-Aufruf), Hero-Cover, Auftritts-Flyer,
   Galerie-Kacheln, Lightbox-Originale und die Admin-Thumbnails.
2. **`<Image>` ohne `sizes`.** Ohne Angabe nimmt next/image 100vw an und liefert die
   1920-px-Variante — auch für eine 190-px-Kachel.
3. **`cacheControl` beim Upload nicht gesetzt.** Supabase-Standard ist `max-age=3600`, Besucher
   haben also stündlich alles neu geladen.
4. **`preload="metadata"` auf Video-Kacheln mit Poster** — unnötiger Zugriff auf 16-MB-Dateien.

**Falle: SQL-Schreibzugriff invalidiert die CDN nicht.** `storage.objects.metadata` per SQL auf
`max-age=31536000` zu ziehen (Migration 0014) ändert nur die Origin-Antwort. Bereits im Edge-Cache
liegende Antworten liefern den alten Header weiter (`curl -D -` zeigt `cf-cache-status: HIT` mit
`age:` von mehreren Wochen), und ein Cache-Buster als Query-Parameter hilft **nicht** — die
Smart CDN ignoriert die Query-String im Cache-Schlüssel. Nur ein Schreibvorgang über die
Storage-API invalidiert. Für Bilder ist das ohne Belang (die laufen jetzt über die
Next/Vercel-Optimierung mit eigenem 31-Tage-Cache); offen bleibt es allein für die direkt
ausgelieferten Videodateien, die beim nächsten Neu-Upload sofort korrekt sind.

**Diagnose-Werkzeuge:** `get_logs` (service `storage`) zeigt am User-Agent, ob ein Objekt vom
Browser direkt (`Mozilla/…` = ungünstig) oder vom Optimizer (`vercel-image-optimization/1.0` = gut)
geholt wird. Größte Objekte:
`select bucket_id, name, pg_size_pretty((metadata->>'size')::bigint) from storage.objects order by (metadata->>'size')::bigint desc limit 20;`

### Zweite Runde: Videos (30.07.2026)

Nach der Bild-Umstellung standen 6,45 GB auf der Uhr. Die Bilder waren nicht mehr die Ursache —
übrig war **alles, was kein `<Image>` sein kann**, und das sind die Videos.

Gemessen mit einem Playwright-Skript, das pro Seitenaufruf mitschreibt, welche
`supabase.co/storage`-URLs mit welcher `content-length` durchs Netz gehen. Vorher/nachher:

| Seite | vorher | nachher |
|---|---|---|
| `/` | 6405 kB | **0 kB** |
| `/steffen` | 6405 kB | **0 kB** |
| `/shows` | tastete die 16-MB-Datei an | **0 kB** |

Die vier Ursachen:

1. **`preload="metadata"` lädt in Chrome die GANZE Datei.** Das ist die wichtigste Erkenntnis und
   widerspricht dem, was der Attributname verspricht: Im Mitschnitt stand `readyState: 4`
   (HAVE_ENOUGH_DATA) und 6405 kB übertragen — also die komplette Datei, nicht der Header. Wo ein
   Poster hinterlegt ist, gehört deshalb **immer** `preload="none"` hin. Betraf `CaptainVideo`
   (Bühnen-Video, auf `/` UND `/steffen`, über die Fallback-Kette dieselbe 6,4-MB-Datei) sowie die
   Video-Kacheln der Show-Seiten.
2. **Die Bedingung `preload={poster ? "none" : "metadata"}` war genau falsch herum.** Gedacht war:
   ohne Poster braucht der Browser wenigstens das erste Bild. Tatsächlich kostet der Fall ohne
   Poster damit am meisten — und traf ausgerechnet das 16-MB-Video von „Comedy Eiskalt", das keins
   hatte. Jetzt überall unbedingt `preload="none"`.
3. **`poster`-Attribute zeigten auf Storage-Originale.** Ein `poster` ist ein Attribut, keine
   Komponente, kann also nicht durch `next/image` laufen. Lösung: `optimizedImageUrl()` in
   `lib/media.ts` baut die `/_next/image`-URL von Hand. Die `width` muss eine der Breiten aus
   `deviceSizes`/`imageSizes` in `next.config.ts` sein, sonst antwortet der Optimizer mit 400.
4. **Admin-Vorschauen.** „Videos & Speicher" zeigt alle Medien-Plätze gleichzeitig, eine Show-Seite
   alle ihre Videos — jeder Aufruf des Admin-Bereichs fasste damit jede Videodatei an. Beim Testen
   der größte Einzelposten, weil der Admin viel häufiger geladen wird als die Website.

**Fehlende Poster nachträglich erzeugen.** `preload="none"` ohne Poster heißt: schwarze Fläche, bis
jemand auf Play drückt (mit `preload="none"` lädt der Browser auch bei gesetztem `src` nichts). Für
die beiden betroffenen Videos sind die Standbilder aus dem Video selbst extrahiert — Rezept, falls
es wieder gebraucht wird:

- Das ffmpeg im Playwright-Cache **kann keine MP4-Dateien lesen** (Minimal-Build fürs
  Bildschirmaufzeichnen, „Invalid data found when processing input"). Stattdessen Chromium
  benutzen: Video laden, `currentTime` setzen, Frame auf ein Canvas zeichnen, `toDataURL("image/webp")`.
- Dabei **`chromium.launch({ channel: "chrome" })`**, nicht das Playwright-Chromium: dem fehlt
  H.264 (`canPlayType('video/mp4; codecs="avc1.42E01E"')` liefert `""`), Videos bleiben dort leer.
- Quelle und Seite brauchen dieselbe Herkunft, sonst blockt Chrome den Canvas-Auslesezugriff —
  Dateien also über einen lokalen HTTP-Server ausliefern, nicht per `file://`.
- Zuschnitt auf das Anzeige-Seitenverhältnis („cover"), sonst passt das Poster nicht zum
  `object-fit` des `<video>`. Ergebnis: 15 kB und 75 kB statt 6,4 MB und 16 MB pro Aufruf.
- Die Poster liegen als lokale Dateien in `public/assets/media/…` und werden von Migration 0020
  eingetragen. Grund für lokal statt Storage: null Supabase-Egress — und ein Upload in den Storage
  bräuchte einen Service-Role-Key, der lokal nicht in `.env.local` steht (Insert-Policy verlangt
  `authenticated`).

**Was strukturell offen bleibt:** Die Videodateien selbst gehen weiterhin direkt vom Browser an den
Supabase-Storage, sobald jemand auf Play drückt. Auf dem Free-Plan gibt es dagegen kein Werkzeug:
Smart CDN ist erst ab Pro aktiv, und Free zählt cached und uncached Egress gemeinsam gegen dieselben
5 GB. Vergleichszahl: Vercel enthält auf Hobby 100 GB Fast Data Transfer, auf Pro 1 TB. Die Dateien
in `public/assets/media/steffen/` sind als `localFallback` in `lib/site-media.ts` verdrahtet — wer
einen Medien-Platz im Admin leert, liefert das Video über das Vercel-CDN aus und erzeugt null
Supabase-Egress. Preis: Videowechsel nur per Deploy. Dauerhafte Alternative wäre ein Storage ohne
Egress-Kosten (Cloudflare R2) oder echtes Streaming mit Adaptive Bitrate (Bunny Stream).

**Storage-Bestand am 30.07.2026:** 149 MB in 61 Dateien, davon **109 MB in 43 verwaisten Dateien**
(von keiner Tabelle referenziert) — u. a. zwei 16-MB-Videos vom 13.06. Abfrage für den nächsten
Durchgang, wichtig: **alle** Pfad-Spalten aufzählen, sonst gelten benutzte Dateien als Waisen
(`shows.background_image_path` fehlte im ersten Versuch):
`select table_name, column_name from information_schema.columns where table_schema='public' and column_name like '%path%';`

## Supabase-Sicherheit & Migrationen

**Ein 204 beim RLS-Test bedeutet NICHT, dass der Schreibzugriff erlaubt war.** Wer mit dem
anon-Key prüft, ob RLS hält, bekommt bei `PATCH`/`DELETE` ein `HTTP 204 No Content` — und zwar in
*beiden* Fällen: wenn geschrieben wurde **und** wenn RLS alle Zeilen weggefiltert hat (dann
„0 Zeilen betroffen", kein 403). Ein 204 ist also kein Beweis für eine Lücke, aber auch keine
Entwarnung. Immer danach den Inhalt gegenprüfen, sonst hält man eine intakte Absicherung für ein
Loch — oder überschreibt beim Testen Produktionsdaten, ohne es zu merken:

```sql
select slug, length(content) from legal_pages;   -- Länge unverändert?
select count(*) from inquiries;                  -- Anfragen noch da?
```

Nicht-destruktiv prüfen lässt sich stattdessen mit `POST` und `Prefer: return=representation`:
blockiert RLS, kommt ein eindeutiger `42501` („new row violates row-level security policy").

**Die Migrations-Historie war lückenhaft — am 30.07.2026 repariert.** Die Historie kannte 12
Einträge, im Repo lagen 20 Dateien: 0002/0003/0004 sowie 0014/0016/0017/0018 waren inhaltlich
eingespielt, aber ohne Historien-Zeile (per `execute_sql` statt `apply_migration` angewendet).
Folge war, dass `supabase db push` und jeder Wiederaufbau aus den Migrationen unzuverlässig
gewesen wären.

Repariert wurde durch **Nachtragen der Historien-Zeilen**, nicht durch erneutes Ausführen des SQL
— vorher wurde für jede Lücke einzeln gegen `information_schema` geprüft, dass Tabelle bzw.
Spalte wirklich existiert. Die Versionsnummern sind so gewählt, dass ihre Reihenfolge zur
Datei-Nummerierung passt. Wenn wieder eine Lücke auftaucht, ist das das Muster:

```sql
insert into supabase_migrations.schema_migrations (version, name)
values ('20260729140000', '0016_offers_pro_show') on conflict (version) do nothing;
```

**Damit es nicht wieder passiert:** Migrationen immer über `apply_migration` einspielen, nie über
`execute_sql`. Die Namen der frühen Einträge (`init`, `add_appearance_color_and_flyer`) weichen
weiterhin von den Dateinamen ab — das ist Altbestand und harmlos, die Zuordnung steht in der
Reihenfolge.

**`show_images` fiel aus der RLS-Konvention — am 30.07.2026 angeglichen (Migration 0022).**
Die Policy dort galt als einzige im Projekt für die Rolle `public` und prüfte die Berechtigung im
Ausdruck (`auth.role() = 'authenticated'`) statt über `to authenticated`. Die Wirkung war
dieselbe, aber sie hing an der nicht mehr dokumentierten Helferfunktion `auth.role()`: Fällt die
weg, bricht nicht nur das Schreiben, sondern auch das **Lesen** der Show-Bilder, weil Postgres
alle für die Operation geltenden Policies auswertet — nicht nur die, die am Ende greift. Heißen
jetzt `public read show_images` / `admin all show_images` wie überall sonst.

**Trigger-Funktionen brauchen kein `EXECUTE` für `anon`.** Migration 0021 hat eine
`SECURITY DEFINER`-Triggerfunktion angelegt; der Supabase-Advisor meldete daraufhin 0028/0029
(„callable via /rest/v1/rpc/"). `revoke execute … from anon, authenticated, public` behebt das,
**ohne** den Trigger zu beschädigen: Postgres prüft das EXECUTE-Recht beim `CREATE TRIGGER`, nicht
beim Feuern. Als `anon` gegengeprüft — Formular-Insert geht weiter, die Ratenbremse greift, der
Direktaufruf wird mit „permission denied for function" abgewiesen.

## UI-Verifikation

Kein Playwright im Repo. Browser liegen unter `~/Library/Caches/ms-playwright`, das CLI in
`~/.npm/_npx/*/node_modules/.bin/playwright` — die Versionen passen nicht immer zusammen
(„Executable doesn't exist at …chromium_headless_shell-XXXX"), dann den anderen npx-Cache-Ordner nehmen.

Zwei Stolpersteine im Playwright-Skript: die Browser im Cache können älter sein als jede
npx-Version (dann `chromium.launch({ executablePath: '~/Library/Caches/ms-playwright/chromium_headless_shell-<rev>/chrome-mac/headless_shell' })`
setzen statt `playwright install` zu starten), und das **Consent-Overlay fängt jeden Klick ab** —
vor Interaktionen `.consent-btn-reject` klicken. Bei langen Seiten `fullPage` meiden und
`locator(sel).screenshot()` nutzen (die Terminseite war vor dem Umbau 24.000 px hoch).

**Admin-Seiten lassen sich nicht ohne Zugangsdaten prüfen.** `/admin/*` hängt an einer echten
Supabase-Session (User `steffen@123.de`). Für visuelle Abnahme im Dashboard braucht es das Passwort
von Lenny; Templates und reine Logik lassen sich stattdessen isoliert rendern.

⚠️ `steffen@123.de` ist ein **Platzhalter** und keine Adresse, die Steffen gehört — es ist der
einzige Account im Projekt. Solange das so bleibt, gibt es keinen funktionierenden
Passwort-Reset: die Mail geht an eine fremde Domain. Vor der Übergabe auf eine echte Adresse
umstellen (Supabase → Authentication → Users), sonst ist der Kunde nach einem vergessenen
Passwort aus seinem eigenen Dashboard ausgesperrt.

## Video-Komprimierung im Browser (30.07.2026)

**Fixe Zielbitrate macht schlanke Dateien größer.** Der erste Anlauf von
`lib/video-compress.ts` kodierte stur mit der in `lib/site-media.ts` hinterlegten Zielbitrate.
Ergebnis am vorhandenen Trailer (1080p, aber nur 0,86 Mbit/s): nach **61 Sekunden** Rechenzeit
ein Ergebnis, das größer war als das Original — gerettet nur von der `MIN_GAIN`-Prüfung, die
dann das Original hochlädt. Fix: `BITRATE_TOLERANCE` vergleicht vorab die aus Größe und Laufzeit
geschätzte Quellbitrate mit dem Ziel und überspringt das Umkodieren, wenn die Quelle schon
schlank ist. Wer die Ziele in der Registry ändert, muss das mitdenken — die Zielbitrate ist
eine **Obergrenze**, kein Sollwert.

**Verifikation ohne Admin-Login:** Die Komprimierung hängt an Browser-APIs (`MediaRecorder`,
`canvas.captureStream`, Web-Audio) und ist mit `node --test` nicht prüfbar. Bewährter Weg: eine
temporäre Seite unter `app/<name>/page.tsx` (außerhalb `/admin`, also ohne Login), die die
Funktion aufruft und das Ergebnis als JSON in ein `<pre id="out">` schreibt, dann per Playwright
mit **echtem Chrome** (`executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`)
ansteuern und die Seite danach löschen. Der Chromium aus dem Playwright-Cache bringt keine
H.264-Kodierung mit; nur mit echtem Chrome zeigt sich, dass `MediaRecorder` MP4 liefert
(`video/mp4;codecs="avc1.4d002a,mp4a.40.2"`) und nicht WebM.
