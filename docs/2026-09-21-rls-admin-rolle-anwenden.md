# Migrationen 0024–0027: was gemacht und was gemessen wurde

21.09.2026. Alle vier Migrationen sind **angewendet**, über den Supabase-MCP gegen
`insyjxxpeywehwnoazjr` (vorher mit `get_project_url` verifiziert — es existiert ein zweites,
älteres Projekt `unirwufvnfggwmdbkbpu`, das nicht zu dieser Website gehört).

Was **nicht** gemessen ist, steht am Ende. Der Abschnitt ist der wichtigste dieser Datei.

## Der Anlass

Der Security Advisor meldete 18 × `rls_policy_always_true` plus die offene Insert-Policy des
Anfrageformulars. Die 18 waren **von außen nicht ausnutzbar** — `/auth/v1/settings` zeigt
`disable_signup: true`, `anonymous_users: false`, keinen OAuth-Anbieter.

Ausnutzbar war etwas, das der Advisor gar nicht meldet: Beim Einfügen in `inquiries` durfte
`anon` auch `status` und `created_at` setzen. Eine RLS-Policy filtert Zeilen, keine Spalten,
und `with check (true)` prüfte nichts.

*Beweis ohne Datenmüll*, vor dem Umbau: Ein Insert mit `{"status":"answered"}` **und** einem
absichtlich ungültigen `type` scheiterte mit `23514` (CHECK-Constraint), nicht mit `42501`
(fehlendes Spaltenrecht). Die Spalte wurde also akzeptiert; nur der Constraint hat abgelehnt.
Mit gültigem `type` wäre die Zeile durchgegangen — ohne „neu"-Badge (beide Zähler im Admin
filtern `status = 'new'`), am Ende der nach `created_at` sortierten Liste, und ohne Mail, weil
ein REST-Insert die Server Action umgeht. Eine Buchungsanfrage ließ sich so unsichtbar machen.

## Ein Befund, der die Begründung verschoben hat

Vor 0025 gezählt: **`auth.users` enthielt drei Konten**, während `context/context.md` „genau
ein User" behauptete und die ganze Absicherung auf dieser Zahl ruhte. Zwei der drei waren nach
dem Anlegen nie benutzt worden — und hatten trotzdem wochenlang Lese- und Löschrecht auf alle
Anfragen mit Namen, E-Mail und Telefonnummern.

Alle drei sind gewollt (Lenny, 21.09.2026) und wurden nach `admin_users` übernommen. Der
Gewinn des Umbaus liegt deshalb nicht bei ihnen, sondern beim **vierten** Konto: Es entsteht
ohne Rechte.

Die eingebaute Bremse hat dabei funktioniert wie vorgesehen — die ursprüngliche Fassung von
0025 wäre bei mehr als einem Konto **abgebrochen**, statt zu raten, wer Administrator ist.

## Was angewendet wurde

| Migration | Inhalt |
| --- | --- |
| `0024` | `revoke all … from anon`, dann `grant insert (type, name, email, phone, message, payload)`. Policy prüft zusätzlich `status = 'new'`. |
| `0025` | `admin_users` + `is_admin()`; 18 Policies maschinell aus `pg_policies` umgestellt, gezählt, mit Abbruch bei unerwarteter Logik. |
| `0026` | Die 3 Storage-Policies nachgezogen — der Advisor meldet sie nicht, weil ihr Ausdruck nicht literal `true` ist. |
| `0027` | Helfer nach `private` umgezogen, weil `public.is_admin()` über `/rest/v1/rpc/is_admin` aufrufbar war (Lint 0029, aufgetaucht **durch** 0025). |

## Was gemessen wurde

Unter echten Rollen (`set local role` + gesetzte JWT-Claims), Zeilen gezählt statt hingesehen.
Alle Schreibproben liefen in einer Transaktion, die per Exception zurückgerollt wurde —
danach gegengeprüft: 0 Probezeilen, Bestand unverändert.

| Rolle | Anfragen | Shows | `one_liners` UPDATE | `one_liners` INSERT |
| --- | --- | --- | --- | --- |
| Konto **in** `admin_users` | 1 | 3 | 5 Zeilen | erlaubt |
| Konto **nicht** in `admin_users` | **0** | 3 | **0 Zeilen** | **42501** |
| `anon` | 42501 | 3 | — | — |

Drei Eigenschaften machen das zu einem Beweis statt zu einer Beruhigung:

1. **Es diskriminiert.** Wären überall 0 Zeilen herausgekommen, wäre es kein Beweis, sondern
   eine tote Abfrage (Regel rls-performance, Punkt 5). Shows stehen bei allen drei Rollen auf
   3 — die öffentliche Lese-Policy greift unabhängig weiter.
2. **Beide Symptome sind da.** Dasselbe fremde Konto scheitert beim UPDATE **still** mit 0
   Zeilen (`USING`) und beim INSERT **laut** mit 42501 (`WITH CHECK`). Wer nur eines misst,
   hat die halbe Policy nicht geprüft (Regel supabase-sicherheit, Punkt 12a).
3. **Nach 0027 erneut gemessen.** Der Umzug des Helfers hätte alles brechen können; die
   Zahlen blieben identisch.

Zusätzlich am Anfrageformular, über die echte REST-API mit dem anon-Key:

| Versuch | vorher | nachher |
| --- | --- | --- |
| Insert mit `status: "answered"` | 23514 (nur Constraint) | **42501** |
| Insert mit `created_at` in der Vergangenheit | 23514 | **42501** |
| Echter Formularweg (die sechs Spalten) | 201 | **201**, `status = 'new'`, echtes `created_at` |
| `select` auf `inquiries` | leer (RLS filtert still) | **42501** (schon das Tabellenrecht fehlt) |

Die Probezeile wurde anschließend gelöscht (eine Zeile, gegengezählt).

**Advisor danach:** Die 18 `rls_policy_always_true` und die Formular-Policy sind weg. Übrig:
`rls_enabled_no_policy` auf `admin_users` (INFO, **absichtlich** — siehe unten) und
`auth_leaked_password_protection` (von Lenny bewusst ignoriert).

**Build und Tests:** 76 Tests grün, Build fehlerfrei, `ƒ Proxy (Middleware)` im Output. Der
Build hat alle 3 Shows als `anon` vorgerendert — ein zweiter, unabhängiger Beleg, dass die
öffentliche Seite unberührt ist.

## Warum `admin_users` keine Policy hat

RLS ist an, Policies gibt es **keine**. Damit kommt über die REST-API niemand an die Tabelle,
auch kein angemeldetes Konto. Eine Policy, die dort `is_admin()` aufriefe, wäre eine Policy,
die ihre eigene Tabelle liest — die Bauart, die nach Regel supabase-sicherheit Punkt 13 jedes
Anlegen unmöglich macht.

Verwaltet wird sie im SQL-Editor des Dashboards (läuft als `postgres`, umgeht RLS). Das ist
zugleich der **Notausstieg**, falls sich jemand aussperrt:

```sql
insert into public.admin_users (user_id) select id from auth.users;
```

## Warum der Helfer in `private` liegt

`EXECUTE` für `authenticated` lässt sich **nicht** entziehen: Postgres prüft das Recht beim
Planen der Abfrage, unabhängig davon, ob der Zweig zur Laufzeit ausgewertet würde. Ein Entzug
ließe jede Policy mit „permission denied for function" scheitern (Regel supabase-sicherheit,
Punkt 7). PostgREST exponiert nur `public` — der Umzug ist deshalb der einzige Weg, der die
Policies am Leben lässt und die RPC-Fläche schließt. `anon` hat weder USAGE auf `private` noch
EXECUTE auf die Funktion.

Der abschließende `drop function public.is_admin()` in 0027 ist **keine Aufräumarbeit, sondern
die Kontrolle**: Postgres verweigert ihn, solange auch nur eine Policy noch auf die alte
Funktion zeigt. Dass er durchlief, beweist, dass alle 21 umgehängt sind.

---

## ⚠️ Was NICHT gemessen ist — das bleibt bei dir

**1. Das Admin-Dashboard im Browser, mit echtem Login.** Dafür braucht es ein Passwort, das
hier nicht vorliegt. Der RLS-Pfad ist identisch mit dem gemessenen (Rolle `authenticated`,
`sub` = Konto-ID), und `proxy.ts` wurde nicht angefasst — aber gemessen ist gemessen, und das
ist es nicht. Bitte einmal einloggen, eine Show speichern, **Seite neu laden** und den Wert
wirklich ansehen: Ein Schreibvorgang, den RLS verschluckt, trifft 0 Zeilen und liefert keinen
Fehler, die UI würde also Erfolg melden.

**2. Die Anfragestrecke über die Server Action, samt Mails.** Absichtlich nicht ausgelöst —
das verschickt echte Mails an Steffens Postfach und an die angegebene Adresse. Der
Datenbankteil ist belegt (HTTP 201 mit exakt den sechs Spalten, die die Action sendet). Was
offen bleibt, ist Pflichtkern Punkt 8: einmal abschicken → in der Datenbank → Mail beim Kunden
→ Bestätigung beim Absender.

**3. Upload, Ersetzen und Löschen im Storage.** Drei getrennte Policies — eine kann brechen,
während die anderen laufen. Gemessen ist, dass die Berechtigung korrekt unterscheidet
(`is_admin` wahr für ein eingetragenes, falsch für ein fremdes Konto) und dass die 35
öffentlich lesbaren Objekte für alle Rollen lesbar bleiben. Der echte Weg durchs Dashboard ist
das nicht.

**4. `mailer_autoconfirm: true` abschalten.** Eine Dashboard-Einstellung, an die der MCP nicht
herankommt: Authentication → Sign In / Providers → Email → **Confirm email**.

⚠️ **Vorher den SMTP von Supabase Auth einrichten.** Der Mailversand der App (Nodemailer,
`SMTP_*` in `.env`) und der von Supabase Auth sind zwei verschiedene Dinge — Supabase Auth
kennt deine `.env` nicht. Ohne eigenen SMTP verschickt Supabase über seinen Standarddienst mit
harter Drosselung und schlechter Zustellbarkeit. Da es in der App **keinen**
Passwort-Reset-Flow gibt (`lib/actions/auth.ts` kann nur Login und Logout), läuft ein Reset
ausschließlich über diese Mail. Kommt sie nicht an, hilft nur noch das Dashboard.
Absenderadresse auf der eigenen Domain wählen — sie steht auf DMARC `p=reject`.
