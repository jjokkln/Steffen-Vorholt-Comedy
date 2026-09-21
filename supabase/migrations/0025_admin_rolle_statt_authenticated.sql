-- „Eingeloggt" war bisher dasselbe wie „Administrator".
--
-- 18 Policies lauteten `for all to authenticated using (true) with check (true)`. Das war
-- nicht ausnutzbar — gemessen am 21.09.2026 über /auth/v1/settings: `disable_signup: true`,
-- `anonymous_users: false`, kein einziger OAuth-Anbieter. Niemand kann sich selbst ein
-- Konto beschaffen, also ist `authenticated` heute genau Steffens Admin-Konto.
--
-- Das Problem ist nicht die Lücke, sondern die Aufhängung: Die gesamte Zugriffskontrolle
-- hing an einem Schalter im Supabase-Dashboard. Wird je ein zweites Konto angelegt — eine
-- Bookerin, ein Testzugang, ein zweites Konto für Steffen selbst —, hat es im selben
-- Augenblick Vollzugriff auf `inquiries` mit Name, E-Mail, Telefon und Nachrichtentext.
-- Dabei wird nichts rot: kein Fehler, kein Test, keine Warnung. Dieselbe Fehlerklasse wie
-- die Rechtstexte in Pflichtkern Punkt 4.
--
-- Danach ist die Berechtigung ein Datensatz statt einer Annahme: Wer in `admin_users`
-- steht, ist Administrator. Ein neues Auth-Konto hat standardmäßig KEINE Rechte.
--
-- ⚠️ NOTAUSSTIEG, falls diese Migration dich aussperrt: Der SQL-Editor im Supabase-
--    Dashboard läuft als `postgres` und umgeht RLS. Dort genügt
--        insert into public.admin_users (user_id) select id from auth.users;
--    Die Rücknahme der ganzen Migration steht am Ende dieser Datei.

-- ─────────────────────────────────────────────────────────────
-- 1. Die Rechtetabelle
-- ─────────────────────────────────────────────────────────────
-- Bewusst eine eigene Tabelle statt eines Claims in `app_metadata`: Ein Claim steckt im
-- JWT und wird erst nach einer neuen Anmeldung wirksam — ein entzogenes Recht wirkt dann
-- bis zu einer Stunde später. Eine Tabelle wirkt sofort.
create table if not exists public.admin_users (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  angelegt_am  timestamptz not null default now(),
  notiz        text not null default ''
);

-- RLS an, aber ABSICHTLICH ohne jede Policy: Dann kommt niemand über die REST-API an diese
-- Tabelle heran, auch kein angemeldeter Nutzer. Verwaltet wird sie im SQL-Editor des
-- Dashboards (läuft als `postgres`, umgeht RLS). Eine Policy, die hier `is_admin()`
-- aufriefe, wäre eine Policy, die ihre eigene Tabelle liest — genau die Bauart, die in
-- Regel supabase-sicherheit Punkt 13 jedes Anlegen unmöglich macht.
alter table public.admin_users enable row level security;

-- ─────────────────────────────────────────────────────────────
-- 2. Bootstrap — und zwar laut, nicht raten
-- ─────────────────────────────────────────────────────────────
-- Der gefährlichste Schritt der ganzen Migration: Wird hier niemand eingetragen, ist das
-- Dashboard nach dem nächsten Statement für alle zu. Deshalb bricht die Migration ab,
-- statt ein plausibles Ergebnis zu erzeugen.
do $$
declare
  anzahl_nutzer int;
begin
  select count(*) into anzahl_nutzer from auth.users;

  if anzahl_nutzer = 0 then
    raise exception
      'In auth.users steht kein einziger Nutzer. Die Migration würde das Admin-Dashboard '
      'für alle sperren. Abbruch.';
  end if;

  if anzahl_nutzer > 1 then
    raise exception
      'In auth.users stehen % Nutzer. Diese Migration weiß nicht, wer davon Administrator '
      'sein soll, und sie rät nicht. Trage die gewollten Konten von Hand in '
      'public.admin_users ein und lasse dann den Rest der Datei laufen.', anzahl_nutzer;
  end if;

  insert into public.admin_users (user_id, notiz)
  select id, 'Bestandskonto, übernommen bei Migration 0025'
    from auth.users
  on conflict (user_id) do nothing;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 3. Der Helfer
-- ─────────────────────────────────────────────────────────────
-- Parameterlos, damit die Policies ihn als `(select public.is_admin())` aufrufen können:
-- Das wird zum InitPlan und läuft einmal pro Statement statt einmal pro Zeile
-- (Regel rls-performance, Punkt 1). SECURITY DEFINER, weil `admin_users` selbst keine
-- Policy hat und der aufrufende Nutzer sie deshalb nicht lesen darf.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- PUBLIC hat auf jede neu angelegte Funktion standardmäßig EXECUTE, und `anon` steckt
-- darin — ein Entzug nur für `anon` liefe ins Leere (Regel supabase-sicherheit Punkt 15).
-- Unbedenklich, weil keine einzige anon-Policy diesen Helfer nennt: Die öffentlichen
-- Lese-Policies ("public read shows" usw.) sind reine `using (true)`-Ausdrücke ohne
-- Funktionsaufruf. Genau das ist die Bedingung aus Punkt 7 derselben Regel.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 4. Die 18 Policies — maschinell, gezählt, mit Abbruch
-- ─────────────────────────────────────────────────────────────
-- Von Hand umgeschrieben verrutscht bei 18 Policies irgendwann eine (Regel
-- rls-performance, Punkt 4). Deshalb aus `pg_policies` erzeugt, mit `alter policy`
-- statt drop/create (die Policy verschwindet so nie, auch nicht für einen Moment), und
-- mit einer Zählung am Ende: Sind es nicht genau 18, hat sich am Schema etwas geändert,
-- das diese Migration nicht kennt — dann bricht sie ab, statt die Hälfte umzustellen.
do $$
declare
  r           record;
  umgestellt  int := 0;
  schon_gut   int := 0;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and policyname like 'admin all %'
       and roles = '{authenticated}'
     order by tablename
  loop
    -- Bereits umgestellt? Dann ist der zweite Lauf ein No-Op (idempotent).
    if r.qual like '%is_admin%' and coalesce(r.with_check, '') like '%is_admin%' then
      schon_gut := schon_gut + 1;
      continue;
    end if;

    -- Sieht die Policy anders aus als erwartet, steckt Logik darin, die hier niemand
    -- kennt. Überschreiben hieße, sie stillschweigend wegzuwerfen.
    if r.qual is distinct from 'true' or r.with_check is distinct from 'true' then
      raise exception
        'Policy "%" auf %.% lautet using=% / with check=% statt true/true. Diese Migration '
        'überschreibt keine Logik, die sie nicht kennt. Von Hand prüfen.',
        r.policyname, r.schemaname, r.tablename, coalesce(r.qual, '<null>'),
        coalesce(r.with_check, '<null>');
    end if;

    execute format(
      'alter policy %I on %I.%I using ((select public.is_admin())) '
      'with check ((select public.is_admin()))',
      r.policyname, r.schemaname, r.tablename
    );
    umgestellt := umgestellt + 1;
  end loop;

  if umgestellt + schon_gut <> 18 then
    raise exception
      'Erwartet waren 18 Admin-Policies, gefunden % (davon % schon umgestellt). Das Schema '
      'weicht vom Stand vom 21.09.2026 ab — erst nachsehen, welche Tabelle dazugekommen '
      'oder weggefallen ist.', umgestellt + schon_gut, schon_gut;
  end if;

  raise notice 'Admin-Policies: % umgestellt, % waren es schon.', umgestellt, schon_gut;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Rücknahme (nur im SQL-Editor des Dashboards, läuft als `postgres`)
-- ─────────────────────────────────────────────────────────────
-- do $$
-- declare r record;
-- begin
--   for r in select schemaname, tablename, policyname from pg_policies
--             where schemaname = 'public' and policyname like 'admin all %'
--   loop
--     execute format('alter policy %I on %I.%I using (true) with check (true)',
--                    r.policyname, r.schemaname, r.tablename);
--   end loop;
-- end $$;
-- drop function if exists public.is_admin();
-- drop table if exists public.admin_users;
