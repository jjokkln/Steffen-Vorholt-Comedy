# E-Mail-Zustellbarkeit: warum Bestätigungsmails im Spam landen

Stand: 26.07.2026 · betrifft `lib/email.ts`, `lib/email-templates/*`

## Ist-Zustand (gemessen)

| Prüfung | Ergebnis |
|---|---|
| Absender | `steffen.vorholt.webseite@gmail.com` über `smtp.gmail.com:587` |
| SPF/DKIM/DMARC des Absenders | **bestehen** — aber für `gmail.com`, nicht für `steffenvorholt.de` |
| SPF-Eintrag auf `steffenvorholt.de` | **fehlt** (kein TXT `v=spf1 …`) |
| DKIM auf `steffenvorholt.de` | **fehlt** (keine Selektoren gefunden) |
| DMARC auf `steffenvorholt.de` | `v=DMARC1;p=reject;` — hart, ohne Reporting-Adresse |
| DNS-Zone | Strato (`docks18.rzone.de`, `shades05.rzone.de`) |
| MX | `smtpin.rzone.de` → Postfächer liegen bei Strato |
| Website | Vercel, kanonisch **`https://www.steffenvorholt.de`** (Apex → 308 auf www) |

## Warum die Mails trotzdem im Spam landen

Die Mails sind technisch korrekt authentifiziert — das Problem ist die Kombination
aus Freemail-Absender und Marken-Mail:

1. **Absenderdomain ≠ Inhaltsdomain.** From ist `@gmail.com`, alle Links und das Logo zeigen
   auf `steffenvorholt.de`. Genau dieses Muster nutzen Phishing-Mails; besonders GMX, Web.de,
   T-Online und Outlook bewerten es hart.
2. **Freemail als Transaktionsabsender.** Ein privates Gmail-Konto, das getriggerte HTML-Mails
   an Fremde schickt, hat keine Sender-Reputation, auf die Filter sich stützen könnten.
3. **`p=reject` ohne SPF/DKIM auf der eigenen Domain.** Wirkt für Filter wie eine halb
   aufgesetzte Mail-Infrastruktur — und blockiert außerdem jeden künftigen Versand über
   `@steffenvorholt.de`, solange SPF/DKIM fehlen.

## Bereits umgesetzt (Code, 26.07.2026)

- Absender mit Anzeigename: `Steffen Vorholt Comedy <…>` statt nackter Adresse.
- Emoji aus den Betreffzeilen entfernt (Emoji + Freemail-Absender = zusätzlicher Spam-Score),
  stattdessen Markenname im Betreff.
- `Reply-To` gesetzt: Bestätigungsmails → Steffens Postfach, Benachrichtigungen → Anfragender.
- Alle Mail-Links auf `https://www.steffenvorholt.de` (vorher 308-Redirect-Kette bei jedem Klick).
- Logo im Mail-Template von **849 KB auf 38 KB** (`logo_steffen_mail.png`, 420 px).
- Plaintext-Alternative zu jeder HTML-Mail (war schon da, bleibt Pflicht).

Das senkt den Spam-Score messbar, löst aber **nicht** die Absenderdomain-Frage.

## Der eigentliche Fix: Versand über `@steffenvorholt.de`

Reihenfolge ist wichtig — DMARC steht auf `p=reject`, ein Versand über die eigene Domain
**ohne** SPF/DKIM würde komplett abgelehnt statt nur einsortiert.

1. **Strato-Postfach anlegen** (Strato-Kundenbereich → E-Mail), z. B. `kontakt@steffenvorholt.de`.
2. **SPF-TXT-Eintrag** in der Strato-DNS-Zone auf den Zonen-Root:
   `v=spf1 include:_spf.strato.com ~all`
3. **DKIM** im Strato-E-Mail-Bereich aktivieren (Strato signiert Mails aus eigenen Postfächern
   selbst; Selektor/Key verwaltet Strato). Danach mit `dig +short TXT <selektor>._domainkey.steffenvorholt.de` prüfen.
4. **DMARC ergänzen** (gleicher Eintrag, um Reporting erweitern), z. B.
   `v=DMARC1; p=quarantine; rua=mailto:dmarc@steffenvorholt.de; pct=100`
   — in der Umstellungswoche `quarantine`, danach zurück auf `p=reject`.
5. **Env-Variablen in Vercel + `.env.local` umstellen** (kein Code-Change nötig):
   ```
   SMTP_HOST=smtp.strato.de
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=kontakt@steffenvorholt.de
   SMTP_PASS=<Postfach-Passwort>
   EMAIL_FROM=kontakt@steffenvorholt.de
   ```
6. **Verifizieren:** im Dashboard `/admin/einstellungen` → „Testmail senden", und einmal an eine
   Adresse von [mail-tester.com](https://www.mail-tester.com) schicken (Ziel: 9–10/10).

**Alternative** (wenn kein Strato-Postfach gewünscht ist): Transaktions-Dienst wie Brevo oder
Postmark mit Domain-Authentifizierung. Auch dort ändern sich nur die sechs Env-Variablen,
weil der Versand generisches SMTP ist.

## Sofortmaßnahme für Steffen (unabhängig vom Rest)

Absenderadresse in seinem Mailprogramm zu den Kontakten hinzufügen und eine Mail, die im
Spam liegt, einmal als „Kein Spam" markieren — das gilt aber nur für sein eigenes Postfach,
nicht für Kunden.

## Quellen

- [STRATO SPF/DKIM/DMARC & Mailserver-Daten](https://patrickhilker.de/hosting-wissen/email-zustellbarkeit/strato)
- [SPF, DKIM & DMARC einrichten](https://saschafix.de/wissen/blog-articles/spf-dkim-dmarc-einrichten/)
- [SPF für Strato einrichten](https://wolf-agents.com/ratgeber/email-security/spf/strato)
