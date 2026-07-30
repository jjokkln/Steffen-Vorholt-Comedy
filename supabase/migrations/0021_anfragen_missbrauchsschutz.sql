-- Missbrauchsschutz für das öffentliche Anfrageformular.
--
-- Warum auf DB-Ebene und nicht im Code: Die Server Action läuft auf Vercel in beliebig vielen
-- Serverless-Instanzen. Ein Zähler im Prozessspeicher wäre pro Instanz getrennt und damit
-- wirkungslos — die Datenbank ist die einzige Stelle, die alle Aufrufe gemeinsam sieht.
--
-- Wogegen es schützt: `submitInquiry` verschickt eine Bestätigungsmail an die im Formular
-- angegebene Adresse. Ohne Begrenzung ist das Formular ein Spam-Verstärker über Steffens
-- SMTP-Konto — der realistische Schaden ist nicht ein Hack, sondern ein gesperrtes Postfach
-- und ruinierte Zustellbarkeit (die Domain steht auf DMARC p=reject).
--
-- Bewusst großzügig gewählt: Eine echte Person, die sich vertippt und dreimal neu abschickt,
-- soll nicht ausgesperrt werden. Die Grenzen greifen erst bei maschinellem Verhalten.

-- Ohne diese Indizes wird die Zählung im Trigger bei wachsender Tabelle langsam.
create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_email_created_at_idx on public.inquiries (lower(email), created_at desc);

create or replace function public.inquiries_missbrauchsschutz()
returns trigger
language plpgsql
-- SECURITY DEFINER ist hier zwingend: Der Trigger läuft im Insert der Rolle `anon`, und `anon`
-- darf `inquiries` per RLS NICHT lesen. Ohne DEFINER würde jede Zählung 0 ergeben und die
-- Begrenzung stillschweigend nie greifen.
security definer
set search_path = public
as $$
declare
  je_adresse integer;
  gesamt integer;
begin
  select count(*) into je_adresse
    from public.inquiries
   where lower(email) = lower(new.email)
     and created_at > now() - interval '1 hour';

  if je_adresse >= 5 then
    raise exception 'ANFRAGE_LIMIT_ADRESSE' using errcode = 'P0001';
  end if;

  select count(*) into gesamt
    from public.inquiries
   where created_at > now() - interval '1 hour';

  -- Notbremse gegen verteilte Bots mit wechselnden Adressen. 60 echte Anfragen in einer Stunde
  -- hat diese Seite nie gehabt (Bestand am 30.07.2026: 1 Anfrage insgesamt).
  if gesamt >= 60 then
    raise exception 'ANFRAGE_LIMIT_GESAMT' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- Harte Obergrenzen auch in der DB, nicht nur im Formular: Die Server Action ist über die
-- REST-API umgehbar, `inquiries` hat eine anon-INSERT-Policy. Ohne Begrenzung kann jemand
-- megabyteweise Text in die Tabelle schreiben.
alter table public.inquiries
  drop constraint if exists inquiries_laengen_check;
alter table public.inquiries
  add constraint inquiries_laengen_check check (
    char_length(name) <= 120
    and char_length(email) <= 254        -- RFC 5321
    and char_length(phone) <= 40
    and char_length(message) <= 5000
    and pg_column_size(payload) <= 4096
  );

drop trigger if exists inquiries_missbrauchsschutz_trigger on public.inquiries;
create trigger inquiries_missbrauchsschutz_trigger
  before insert on public.inquiries
  for each row execute function public.inquiries_missbrauchsschutz();

-- Nachtrag (Migration 0023): Die Funktion darf nicht über /rest/v1/rpc/ aufrufbar sein
-- (Supabase-Advisor 0028/0029 — SECURITY DEFINER in der öffentlichen API). Der Trigger
-- funktioniert trotzdem: Postgres prüft EXECUTE beim CREATE TRIGGER, nicht beim Feuern.
revoke execute on function public.inquiries_missbrauchsschutz() from anon, authenticated, public;
