-- Nachzug zu 0025: `public.is_admin()` war über `/rest/v1/rpc/is_admin` aufrufbar.
--
-- Gemeldet von `get_advisors(security)` direkt nach dem Anwenden von 0025 — Lint 0029,
-- „Signed-In Users Can Execute SECURITY DEFINER Function". Dieselbe Klasse, die Migration
-- 0023 für `inquiries_missbrauchsschutz()` behandelt hat, und dieselbe Lehre: Der Advisor
-- findet es, das eigene Lesen des Codes nicht (Regel supabase-sicherheit, Punkt 15).
--
-- Der konkrete Schaden wäre klein gewesen — die Funktion ist parameterlos und sagt einem
-- angemeldeten Konto nur, ob es selbst Administrator ist; das merkt es ohnehin daran, ob
-- das Dashboard Daten zeigt. Trotzdem behoben, aus zwei Gründen: Eine SECURITY-DEFINER-
-- Funktion in der öffentlichen API ist eine Fläche, die beim nächsten Umbau der Funktion
-- (ein Parameter, eine zweite Abfrage) still gefährlich wird. Und der ganze Zweck von 0024–
-- 0026 war, dass der Advisor wieder etwas bedeutet: Eine dauerhaft stehende Warnung macht
-- die nächste echte unsichtbar.
--
-- ⚠️ EXECUTE für `authenticated` kann NICHT entzogen werden. Postgres prüft die
--    Ausführungsrechte beim Planen der Abfrage, unabhängig davon, ob der Zweig zur Laufzeit
--    ausgewertet würde — ein Entzug ließe jede Policy mit „permission denied for function"
--    scheitern (Regel supabase-sicherheit, Punkt 7). Der Weg ist deshalb nicht der Entzug,
--    sondern der Umzug: PostgREST exponiert nur `public`, also ist eine Funktion in einem
--    eigenen Schema nicht mehr über die API erreichbar und in Policies weiter benutzbar.

-- ─────────────────────────────────────────────────────────────
-- 1. Ein Schema, das die API nicht kennt
-- ─────────────────────────────────────────────────────────────
create schema if not exists private;

-- PUBLIC bekommt auf ein neues Schema zwar kein USAGE, aber das ist eine Vorgabe, keine
-- Zusicherung — deshalb ausdrücklich. `anon` bekommt weder USAGE noch EXECUTE: Keine
-- einzige anon-Policy ruft den Helfer auf, und das muss so bleiben.
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- `search_path = ''` statt `= public`: Damit kann kein Objekt aus einem anderen Schema den
-- Namen `admin_users` überschatten. Die Preise dafür sind die voll qualifizierten Namen.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant  execute on function private.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Die 21 Policies umhängen — maschinell, gezählt
-- ─────────────────────────────────────────────────────────────
-- 18 auf `public`-Tabellen (0025) plus 3 auf `storage.objects` (0026). Postgres deparst den
-- Aufruf ohne Schema-Präfix (`( SELECT is_admin() AS is_admin)`), weil `public` im
-- search_path steht — deshalb wird erst ein etwaiges Präfix normalisiert und dann ersetzt,
-- statt auf eine der beiden Schreibweisen zu hoffen.
do $$
declare
  r            record;
  neues_qual   text;
  neues_check  text;
  befehl       text;
  n            int := 0;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where coalesce(qual, '') like '%is_admin%'
        or coalesce(with_check, '') like '%is_admin%'
     order by schemaname, tablename, policyname
  loop
    neues_qual := regexp_replace(
      regexp_replace(r.qual, 'public\.is_admin\(\)', 'is_admin()', 'g'),
      '\mis_admin\(\)', 'private.is_admin()', 'g');
    neues_check := regexp_replace(
      regexp_replace(r.with_check, 'public\.is_admin\(\)', 'is_admin()', 'g'),
      '\mis_admin\(\)', 'private.is_admin()', 'g');

    -- Eine INSERT-Policy hat kein USING, eine DELETE-Policy kein WITH CHECK. Wer beides
    -- blind schreibt, bekommt einen Syntaxfehler mitten im Lauf.
    befehl := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if neues_qual is not null then
      befehl := befehl || format(' using (%s)', neues_qual);
    end if;
    if neues_check is not null then
      befehl := befehl || format(' with check (%s)', neues_check);
    end if;

    execute befehl;
    n := n + 1;
  end loop;

  if n <> 21 then
    raise exception
      'Erwartet waren 21 Policies mit Helferaufruf (18 Tabellen + 3 Storage), umgestellt %. '
      'Abbruch, bevor die alte Funktion gelöscht wird.', n;
  end if;

  raise notice '% Policies auf private.is_admin() umgehängt.', n;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Die alte Funktion löschen — und das ist zugleich der Beweis
-- ─────────────────────────────────────────────────────────────
-- Postgres verweigert den DROP, solange auch nur eine Policy noch auf sie zeigt. Dieser
-- Befehl ist damit keine Aufräumarbeit, sondern die Kontrolle über Schritt 2: Läuft er
-- durch, hat wirklich keine Policy mehr den alten Aufruf.
drop function public.is_admin();
