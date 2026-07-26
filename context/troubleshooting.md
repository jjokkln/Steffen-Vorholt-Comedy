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

## UI-Verifikation

Kein Playwright im Repo. Browser liegen unter `~/Library/Caches/ms-playwright`, das CLI in
`~/.npm/_npx/*/node_modules/.bin/playwright` — die Versionen passen nicht immer zusammen
(„Executable doesn't exist at …chromium_headless_shell-XXXX"), dann den anderen npx-Cache-Ordner nehmen.

**Admin-Seiten lassen sich nicht ohne Zugangsdaten prüfen.** `/admin/*` hängt an einer echten
Supabase-Session (User `steffen@123.de`). Für visuelle Abnahme im Dashboard braucht es das Passwort
von Lenny; Templates und reine Logik lassen sich stattdessen isoliert rendern.
