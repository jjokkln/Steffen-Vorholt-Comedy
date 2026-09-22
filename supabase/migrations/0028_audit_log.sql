-- Audit-Log: wer hat wann was geändert.
--
-- Warum diese Website eines braucht, obwohl sie keine Konten für Besucher hat:
-- Pflichtkern Punkt 12, Fall 2 — „die Verwaltungsfläche einer Website zählt dazu,
-- auch wenn die Website selbst keine Konten hat". Über /admin werden Preise
-- (`offers`), Showtexte, Termine, Rechtstexte und Bilder geändert; ein Kunde liest
-- eine Zahl auf dieser Seite als Zusage. Die Frage „wer hat das geändert" wird
-- IMMER rückwirkend gestellt — wer erst dann anfängt aufzuzeichnen, hat die
-- Antwort nicht mehr. Seit dem 22.09.2026 hat dieses Projekt drei Admin-Konten,
-- damit ist „wer" auch keine rhetorische Frage mehr.
--
-- ── Die Bauart, und warum sie von der Vorlage abweicht ──────────────────────
--
-- Die Vorlage (boltwork, Baustein „Audit-Log-mit-Abdeckungstest") schreibt mit
-- Service-Role und begründet das damit, dass die Schreibfunktion dann kein
-- offener Kanal ist. Dieses Projekt hat **keinen** Service-Role-Client und soll
-- auch keinen bekommen: Ein solcher Schlüssel in der Vercel-Umgebung umgeht die
-- RLS des gesamten Projekts, und gebraucht würde er allein für diese eine Zeile.
--
-- Stattdessen: Die Tabelle bekommt RLS **ohne INSERT-Policy** — niemand kann
-- direkt hineinschreiben, auch kein angemeldeter Admin über die REST-API. Der
-- einzige Weg ist `private.audit_schreiben()`, eine SECURITY-DEFINER-Funktion,
-- die den Handelnden **selbst** aus `auth.uid()` nimmt statt ihn als Parameter
-- entgegenzunehmen. Damit ist der Fehler, vor dem die Vorlage warnt (fremde
-- Nutzer-Id, erfundene Aktion), hier strukturell ausgeschlossen statt nur
-- erschwert: Man kann die Id gar nicht angeben.
--
-- Die Funktion liegt in `private`, nicht in `public` — PostgREST exponiert nur
-- `public`, also ist sie über /rest/v1/rpc nicht erreichbar
-- (Regel supabase-sicherheit, Punkt 15).

-- ── Tabelle ────────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Was passiert ist. Freitext auf DB-Ebene, in TypeScript eine Union — die
  -- Beschriftungstabelle dort ist `Record<AuditAktion, string>`, eine neue
  -- Aktion ohne Beschriftung ist damit ein Typfehler (Pflichtkern 12, Punkt 2).
  aktion text not null,

  -- Woran. `objekt` ist die Art (show, termin, rechtstext …), `objekt_id` der
  -- Datensatz. Beide Pflicht: Ein Protokolleintrag ohne Ziel beantwortet die
  -- Frage nicht, für die er geschrieben wurde.
  objekt text not null,
  objekt_id text not null,

  -- Wer. Fremdschlüssel und Pflichtfeld (Pflichtkern 12, Punkt 3) — ein Name im
  -- JSONB wäre eine Namensgleichheit, keine Zuordnung. `on delete restrict`:
  -- Ein gelöschtes Konto darf seine Spur nicht mitnehmen; wer ein Konto
  -- entfernen will, muss sich vorher mit dem Protokoll befassen.
  handelnder uuid not null references auth.users (id) on delete restrict,

  -- Wie das Objekt hieß, als gehandelt wurde. Bewusst redundant: Nach dem
  -- Löschen einer Show ist `objekt_id` eine Nummer, an die sich niemand
  -- erinnert. Das ist eine Beschriftung, KEINE Zuordnung — die läuft über
  -- `objekt_id`.
  bezeichnung text,

  -- Kontext, sparsam. ⚠️ Ein Protokoll ist selbst eine Verarbeitung: Hier
  -- gehört hinein, was sich geändert hat — keine ganzen Formularinhalte, keine
  -- IP-Adressen, keine Standortdaten „weil man sie gerade hat"
  -- (Pflichtkern 12, Warnkasten).
  details jsonb
);

comment on table public.audit_logs is
  'Änderungen über die Verwaltungsfläche. Schreiben nur über private.audit_schreiben(); '
  'Aufbewahrung 24 Monate, siehe Datenschutzerklärung.';

-- Die Abfrage im Admin ist immer „das Neueste zuerst", meist je Objekt.
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_objekt_idx on public.audit_logs (objekt, objekt_id, created_at desc);

-- ── RLS: lesen darf der Admin, schreiben darf niemand direkt ───────────────

alter table public.audit_logs enable row level security;

-- Absichtlich NUR eine SELECT-Policy. Ohne INSERT-, UPDATE- und DELETE-Policy
-- lehnt Postgres jeden direkten Schreibversuch ab — auch den eines angemeldeten
-- Admins über die REST-API. Ein Protokoll, das sein eigener Betroffener ändern
-- kann, ist keins.
drop policy if exists "admin read audit_logs" on public.audit_logs;
create policy "admin read audit_logs"
  on public.audit_logs for select
  to authenticated
  using ((select private.is_admin()));

-- Spaltenrechte zusätzlich entziehen: Eine fehlende Policy reicht zwar, aber
-- `grant all … to anon` gehört zum Supabase-Standard und wäre der Stolperstein,
-- falls je eine Policy dazukommt (Regel supabase-sicherheit, Punkt 18).
revoke all on public.audit_logs from anon;

-- ── Die einzige Schreibstelle ──────────────────────────────────────────────

create or replace function private.audit_schreiben(
  p_aktion text,
  p_objekt text,
  p_objekt_id text,
  p_bezeichnung text default null,
  p_details jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_handelnder uuid := auth.uid();
  v_id uuid;
begin
  -- Der Handelnde wird NICHT übergeben, sondern gelesen. Das ist der ganze
  -- Punkt dieser Funktion: Eine fremde Nutzer-Id lässt sich nicht angeben.
  if v_handelnder is null then
    raise exception 'AUDIT_OHNE_ANMELDUNG' using errcode = 'P0001';
  end if;

  -- Und nur ein Admin darf protokollieren — sonst könnte ein beliebiges
  -- angemeldetes Konto das Protokoll mit Rauschen füllen.
  if not private.is_admin() then
    raise exception 'AUDIT_OHNE_BERECHTIGUNG' using errcode = 'P0001';
  end if;

  insert into public.audit_logs (aktion, objekt, objekt_id, handelnder, bezeichnung, details)
  values (p_aktion, p_objekt, p_objekt_id, v_handelnder, p_bezeichnung, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function private.audit_schreiben is
  'Einzige Schreibstelle des Audit-Logs. Nimmt den Handelnden aus auth.uid(), nicht als Parameter.';

-- PUBLIC hat auf jede neue Funktion standardmäßig EXECUTE, und `anon` steckt
-- darin — der Entzug muss deshalb bei PUBLIC ansetzen
-- (Regel supabase-sicherheit, Punkt 15).
revoke execute on function private.audit_schreiben(text, text, text, text, jsonb) from public, anon;
grant execute on function private.audit_schreiben(text, text, text, text, jsonb) to authenticated;

-- ── Aufbewahrung ───────────────────────────────────────────────────────────
--
-- 24 Monate. Die Frist steht hier und in der Datenschutzerklärung; ein
-- Protokoll ohne Löschfrist ist ein Datensatz auf Vorrat. Aufgeräumt wird beim
-- Schreiben ist zu teuer und beim Lesen zu spät — deshalb eine Funktion, die
-- der Admin-Bereich beim Öffnen des Protokolls mitlaufen lässt.

create or replace function private.audit_aufraeumen()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anzahl integer;
begin
  delete from public.audit_logs where created_at < now() - interval '24 months';
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

revoke execute on function private.audit_aufraeumen() from public, anon;
grant execute on function private.audit_aufraeumen() to authenticated;
