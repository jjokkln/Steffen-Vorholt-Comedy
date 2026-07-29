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
*mit* `.ts` — dafür meldet `tsc --noEmit` je Testdatei ein TS5097. Das ist im Repo Normalzustand
und kein neuer Fehler. Nur getestete Module dürfen keine Wert-Imports über den `@/`-Alias haben
(node löst den Alias nicht auf); `import type` ist unproblematisch, weil es wegkompiliert wird.

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
