-- Korrektur zu 0028: Die Schreibfunktion muss in `public` liegen.
--
-- In 0028 stand sie in `private`, mit der Begründung aus der Regel
-- supabase-sicherheit (Punkt 15): „PostgREST exponiert nur `public`, eine
-- Funktion in einem eigenen Schema ist deshalb nicht über /rest/v1/rpc
-- erreichbar." Das stimmt — und genau deshalb konnte auch die **Anwendung** sie
-- nicht aufrufen. Der Satz gilt für Policy-Helfer, die nur Postgres selbst
-- braucht (`private.is_admin()` wird in Policies ausgewertet, nie vom Client);
-- eine Funktion, die eine Server Action aufruft, geht denselben Weg wie jeder
-- andere Client-Aufruf.
--
-- Der Schutz, auf den es ankommt, hängt nicht am Schema: Die Funktion nimmt den
-- Handelnden aus `auth.uid()` statt als Parameter, und sie verlangt Admin. Ein
-- fremder Name lässt sich damit nicht eintragen, und `anon` kommt gar nicht
-- heran. Was ein Admin könnte — einen Eintrag über eine Handlung schreiben, die
-- er nicht vorgenommen hat — kann er als Admin ohnehin, und er kann keinen
-- vorhandenen Eintrag ändern oder löschen: Die Tabelle hat nur eine
-- SELECT-Policy.

create or replace function public.audit_schreiben(
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
  if v_handelnder is null then
    raise exception 'AUDIT_OHNE_ANMELDUNG' using errcode = 'P0001';
  end if;

  if not private.is_admin() then
    raise exception 'AUDIT_OHNE_BERECHTIGUNG' using errcode = 'P0001';
  end if;

  insert into public.audit_logs (aktion, objekt, objekt_id, handelnder, bezeichnung, details)
  values (p_aktion, p_objekt, p_objekt_id, v_handelnder, p_bezeichnung, p_details)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.audit_schreiben is
  'Einzige Schreibstelle des Audit-Logs. Nimmt den Handelnden aus auth.uid(), nicht als Parameter.';

-- `anon` bleibt draußen: Ein Protokoll über die Verwaltungsfläche geht einen
-- Besucher nichts an, und niemand ohne Anmeldung soll Zeilen erzeugen können.
revoke execute on function public.audit_schreiben(text, text, text, text, jsonb) from public, anon;
grant execute on function public.audit_schreiben(text, text, text, text, jsonb) to authenticated;

-- Dasselbe für die beiden Aufräumfunktionen: Sie werden aus dem Admin-Bereich
-- aufgerufen, wenn das Protokoll geöffnet wird. Eine Aufbewahrungsfrist, die
-- niemand ausführt, steht nur auf dem Papier.
create or replace function public.audit_aufraeumen()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anzahl integer;
begin
  if not private.is_admin() then
    raise exception 'AUDIT_OHNE_BERECHTIGUNG' using errcode = 'P0001';
  end if;
  delete from public.audit_logs where created_at < now() - interval '24 months';
  get diagnostics v_anzahl = row_count;

  delete from public.einwilligungen where created_at < now() - interval '36 months';
  return v_anzahl;
end;
$$;

revoke execute on function public.audit_aufraeumen() from public, anon;
grant execute on function public.audit_aufraeumen() to authenticated;

-- Die Fassungen in `private` sind damit tot. `drop` ist hier die Kontrolle,
-- nicht die Aufräumarbeit: Postgres verweigert ihn, solange noch etwas darauf
-- zeigt (Regel supabase-sicherheit, Punkt 15).
drop function if exists private.audit_schreiben(text, text, text, text, jsonb);
drop function if exists private.audit_aufraeumen();
drop function if exists private.einwilligungen_aufraeumen();
