# Migrationen 0024–0026 anwenden und messen

Stand 21.09.2026. Die drei Migrationen sind geschrieben, aber **nicht angewendet** — weder
der Supabase-MCP noch die CLI hatten in der Session Zugriff auf `insyjxxpeywehwnoazjr`
(`supabase projects list` zeigt nur Projekte einer anderen Organisation). Alles unten ist
deshalb ungemessen, bis du es gemessen hast.

Reihenfolge einhalten: 0024 ist risikoarm, 0025 kann dich aussperren, 0026 kann den
Medien-Upload brechen.

## Vorbereitung — zwei Tokens

```bash
cd ~/Code_Aktuell/GrowCore/vorholt_landing
set -a && . ./.env && set +a

# Admin-JWT (Passwort aus dem Passwortmanager)
ADMIN_JWT=$(curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"DEINE-ADMIN-MAIL","password":"DEIN-PASSWORT"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
echo "${ADMIN_JWT:0:12}…"   # leer = Login fehlgeschlagen, dann nicht weitermachen
```

---

## Schritt 1 — Migration 0024 (Anfrageformular)

Schließt die einzige Lücke, die heute ohne Voraussetzung ausnutzbar ist: `anon` durfte beim
Einfügen `status` und `created_at` mitsetzen. Gemessen am 21.09.2026 — ein Insert mit
`{"status":"answered"}` scheiterte am `type`-CHECK (23514), **nicht** an fehlenden
Spaltenrechten (42501). Mit gültigem `type` wäre er durchgegangen: keine Mail (die läuft in
der Server Action, nicht im Trigger), kein „neu"-Badge, unten in der nach `created_at`
sortierten Liste. Eine Buchungsanfrage wäre praktisch unsichtbar gewesen.

**Anwenden:** `supabase/migrations/0024_anfragen_nur_formularspalten.sql` im SQL-Editor.

**Messen — beide Richtungen** (Regel supabase-sicherheit 12a: dieselbe Policy lehnt je nach
Ausgangszustand mit zwei verschiedenen Symptomen ab, eine Messung allein beweist nichts):

```bash
# a) Der Angriff MUSS jetzt scheitern — erwartet: 42501 permission denied for column
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/inquiries" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"type":"frage_feedback","name":"Probe","email":"probe@example.org","status":"answered"}'

# b) Der echte Weg MUSS weiter gehen — erwartet: leere Antwort, HTTP 201
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/inquiries" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"type":"frage_feedback","name":"Probe 0024","email":"DEINE-MAIL","phone":"","message":"Probe","payload":{}}'
```

Danach zusätzlich **das echte Formular** auf der Seite einmal abschicken — (b) umgeht die
Server Action und beweist den Mailversand nicht. Beide Probezeilen anschließend im Admin
löschen.

---

## Schritt 2 — Migration 0025 (Admin-Rolle)

⚠️ **Der Schritt, der dich aussperren kann.** Erst zählen, dann anwenden:

```sql
select count(*) from auth.users;   -- muss 1 sein
```

Ist das Ergebnis **nicht 1**, bricht die Migration von selbst ab und sagt warum — dann von
Hand entscheiden, wer in `public.admin_users` gehört.

**Anwenden:** `supabase/migrations/0025_admin_rolle_statt_authenticated.sql`.

**Sofort danach, im selben Fenster** (solange der SQL-Editor offen ist — er läuft als
`postgres` und umgeht RLS, ist also dein Notausstieg):

```sql
select count(*) from public.admin_users;   -- muss 1 sein
select public.is_admin();                  -- im Editor egal, entscheidend ist die Messung unten
```

**Messen — Zeilen zählen, nicht hinsehen** (ein leerer Zustand und eine fehlschlagende Policy
sehen von außen gleich aus):

```bash
# a) Als Admin MUSS Lesen und Schreiben weiter gehen — erwartet: Zeilen > 0
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/shows?select=id" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $ADMIN_JWT" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("Zeilen:",len(d) if isinstance(d,list) else d)'

# b) Anfragen als Admin lesbar? — erwartet: Zeilen >= 0 OHNE Fehlerobjekt
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/inquiries?select=id" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $ADMIN_JWT" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("Zeilen:",len(d) if isinstance(d,list) else d)'

# c) Die öffentliche Seite MUSS unberührt sein — erwartet: Zeilen > 0
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/shows?select=id" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  | python3 -c 'import sys,json;d=json.load(sys.stdin);print("Zeilen:",len(d) if isinstance(d,list) else d)'
```

⚠️ **(c) ist die Probe auf den `revoke execute`.** Meldet sie
`permission denied for function is_admin`, ist genau die Falle aus Regel
supabase-sicherheit Punkt 7 eingetreten — dann im SQL-Editor
`grant execute on function public.is_admin() to anon;` und die Ursache nachsehen.

Zuletzt **das Admin-Dashboard im Browser** öffnen und eine Show speichern. Ein Schreibvorgang,
den RLS verschluckt, trifft 0 Zeilen und liefert **keinen** Fehler (Regel 12) — die UI würde
Erfolg melden. Also nach dem Speichern die Seite neu laden und den Wert wirklich ansehen.

**Die eigentliche Probe** (die, für die der ganze Umbau gemacht ist): Leg im Dashboard unter
Authentication einen zweiten Testnutzer an, trag ihn **nicht** in `admin_users` ein, hol dir
mit seinen Zugangsdaten ein JWT und wiederhole (b). Erwartet: **0 Zeilen**. Vorher hätte er
alle Anfragen mit Namen, E-Mail und Telefonnummer gesehen. Testnutzer danach löschen.

---

## Schritt 3 — Migration 0026 (Storage)

**Anwenden:** `supabase/migrations/0026_storage_admin_rolle.sql`.

**Messen:** Im Admin ein Bild hochladen, ein vorhandenes ersetzen und eines löschen. Alle drei
Wege sind getrennte Policies — einer kann brechen, während die anderen laufen. Öffentliche
Bild-URLs auf der Website müssen weiter laden (die Lese-Policy wurde nicht angefasst).

---

## Schritt 4 — E-Mail-Bestätigung einschalten

`mailer_autoconfirm: true` steht heute in den Auth-Settings, ist Pflichtkern Punkt 11.3
(„Signup ist verifiziert, kein `mailer_autoconfirm` in Produktion").

Dashboard → Authentication → Sign In / Providers → Email → **Confirm email** an.

⚠️ **Vorher den SMTP von Supabase Auth einrichten, sonst sperrst du dich mittelfristig aus.**
Der Mailversand der App (Nodemailer, `SMTP_*` in `.env`) und der von Supabase Auth sind zwei
verschiedene Dinge — Supabase Auth kennt deine `.env` nicht. Ohne eigenen SMTP verschickt
Supabase über seinen Standarddienst mit harter Drosselung (wenige Mails pro Stunde) und
schlechter Zustellbarkeit. Da es in der App **keinen** Passwort-Reset-Flow gibt
(`lib/actions/auth.ts` kann nur Login und Logout), läuft ein Reset ausschließlich über diese
Mail. Kommt sie nicht an, hilft nur noch das Dashboard.

Also: Dashboard → Authentication → Emails → SMTP Settings → dieselben Zugangsdaten wie in
`.env` eintragen. Absenderadresse auf der eigenen Domain wählen — die steht auf DMARC
`p=reject`, eine fremde Absenderdomain wird sonst abgelehnt.

Danach einmal echt auslösen: Passwort-Reset für das Admin-Konto anfordern und prüfen, dass die
Mail ankommt. Eine nicht ausgelöste Mailstrecke ist kein Nachweis (Pflichtkern Punkt 8).

---

## Schritt 5 — Advisor nachzählen

```
get_advisors(type: "security")
```

Erwartet danach: die 18 × `rls_policy_always_true` auf den `admin all`-Policies sind weg, und
`public insert inquiries` ebenfalls (die Policy prüft jetzt `status = 'new'`).
Übrig bleibt `auth_leaked_password_protection` — von dir bewusst ignoriert.

Bleibt eine Warnung stehen, die hier nicht aufgeführt ist: nicht wegklicken, sondern
nachsehen. Genau dafür wurde der Rest grün gemacht.
