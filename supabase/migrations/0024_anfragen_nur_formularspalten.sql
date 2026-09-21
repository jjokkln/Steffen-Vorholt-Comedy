-- Das öffentliche Anfrageformular durfte mehr Spalten setzen, als es braucht.
--
-- Gemessen am 21.09.2026 gegen die Produktionsdatenbank: ein REST-Insert als `anon` mit
-- {"status":"answered","created_at":"2020-01-01T00:00:00Z"} wurde NICHT an fehlenden
-- Spaltenrechten abgewiesen, sondern erst am `inquiries_type_check` — Fehlercode 23514,
-- nicht 42501. Mit gültigem `type` wäre die Zeile durchgegangen.
--
-- Wirkung: `status` steuert beide Zähler im Dashboard (app/admin/(dashboard)/layout.tsx
-- und page.tsx zählen `status = 'new'`), und die Anfragenliste sortiert nach `created_at`.
-- Eine eingeschleuste Anfrage mit status='answered' und rückdatiertem created_at erzeugt
-- keinen Badge, steht am Ende der Liste und trägt die Farbe „erledigt". Dazu kommt: ein
-- direkter REST-Insert verschickt keine Mail — die läuft in der Server Action, nicht im
-- Trigger. Eine echte Buchungsanfrage lässt sich so von außen faktisch unsichtbar machen.
-- Der Schaden ist kein Datenabfluss, sondern eine verlorene Buchung.
--
-- Warum Spaltenrechte und nicht nur eine Policy: Eine RLS-Policy filtert Zeilen, keine
-- Spalten. `with check (status = 'new')` fängt genau diesen einen Wert ab; ein GRANT auf
-- die sechs Formularspalten fängt auch jede Spalte ab, die künftig dazukommt — dieselbe
-- Überlegung wie die Positivliste in Regel supabase-sicherheit Punkt 16. Beide Schichten
-- zusammen, weil ein späteres `grant all on all tables … to anon` (steht in vielen
-- Supabase-Snippets) die Spaltenrechte sonst lautlos wiederherstellt.

-- ─────────────────────────────────────────────────────────────
-- 1. Spaltenrechte: genau die sechs Felder, die die Server Action sendet
-- ─────────────────────────────────────────────────────────────
-- Gegenprobe der Liste: lib/actions/submit-inquiry.ts baut
-- `{ type, name, email, phone, message, payload }` und ruft `.insert(inquiry)` OHNE
-- `.select()` auf — es wird also auch kein Leserecht gebraucht. `id`, `status` und
-- `created_at` kommen künftig ausschließlich aus den Spalten-Defaults.
revoke all on public.inquiries from anon;
grant insert (type, name, email, phone, message, payload) on public.inquiries to anon;

-- ─────────────────────────────────────────────────────────────
-- 2. Policy als zweite Schicht
-- ─────────────────────────────────────────────────────────────
-- Vorher: `for insert with check (true)` für die Rolle `public` — also ohne jede Prüfung
-- und zugleich für `authenticated` mitgeltend. `authenticated` verliert dadurch nichts:
-- „admin all inquiries" ist `for all` und deckt das Einfügen ab.
drop policy if exists "public insert inquiries" on public.inquiries;
create policy "public insert inquiries" on public.inquiries
  for insert to anon
  with check (status = 'new');
