-- Nachweis erteilter und widerrufener Einwilligungen.
--
-- Pflichtkern Punkt 12, Fall 3: „Handlungen von Besuchern ohne Konto werden als
-- Datensatz festgehalten, nicht als Mail." Von den drei genannten Fällen ist
-- hier einer offen — abgeschickte Formulare liegen als `inquiries` vor, öffentliche
-- Uploads gibt es nicht, die **Einwilligung** aber lag bisher ausschließlich im
-- `localStorage` des Besuchers. `CookieConsentProvider.tsx` nennt in seinem
-- Kommentar Art. 7 Abs. 1 DSGVO als Grund für den Zeitstempel — ein Datum auf dem
-- Gerät des Betroffenen ist jedoch kein Nachweis, den der Verantwortliche führen
-- kann: Es ist weder abfragbar noch zählbar, und es verschwindet mit dem Leeren
-- des Browsers.
--
-- ── Was hier NICHT gespeichert wird, und warum ─────────────────────────────
--
-- Keine IP-Adresse, kein User-Agent, keine Seiten-URL. Ein Protokoll über
-- Menschen ist selbst eine Verarbeitung (Pflichtkern 12, Warnkasten) und
-- bekommt nur die Felder, die es braucht. Für den Nachweis nach Art. 7 Abs. 1
-- gebraucht werden: **wann**, **worin** eingewilligt wurde (Version und
-- Kategorien, also der Text, der gezeigt wurde) und **was entschieden** wurde.
--
-- Die Zuordnung läuft über `besucher_kennung`: eine im Browser erzeugte
-- Zufallszahl ohne Personenbezug. Sie beantwortet die einzige Frage, für die
-- eine Zuordnung nötig ist — „wurde dieselbe Einwilligung später widerrufen".
-- Sie identifiziert kein Gerät und keine Person; wer seinen Speicher leert,
-- bekommt eine neue.

create table if not exists public.einwilligungen (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- 'erteilt' = mindestens eine Kategorie angenommen, 'abgelehnt' = nur das
  -- Nötige, 'widerrufen' = eine frühere Einwilligung zurückgenommen.
  entscheidung text not null check (entscheidung in ('erteilt', 'abgelehnt', 'widerrufen')),

  -- Welche Fassung des Banners gezeigt wurde. Ohne sie ist nicht belegbar,
  -- WORIN eingewilligt wurde — und genau das verlangt Art. 4 Nr. 11 DSGVO
  -- („für den bestimmten Fall").
  banner_version integer not null,

  -- Die Kategorien, wie sie gespeichert wurden, z. B. {"externalMedia": true}.
  kategorien jsonb not null,

  -- Zufallszahl aus dem Browser, siehe Kopf. Kein Personenbezug.
  besucher_kennung text not null check (char_length(besucher_kennung) between 8 and 64)
);

comment on table public.einwilligungen is
  'Nachweis nach Art. 7 Abs. 1 DSGVO. Ohne IP, ohne User-Agent, ohne URL. '
  'Aufbewahrung 36 Monate, siehe Datenschutzerklärung.';

create index if not exists einwilligungen_created_at_idx on public.einwilligungen (created_at desc);
create index if not exists einwilligungen_kennung_idx on public.einwilligungen (besucher_kennung, created_at desc);

alter table public.einwilligungen enable row level security;

-- Lesen darf nur der Admin. Ein Besucher hat nichts davon, die Zeilen zu sehen
-- (er kennt seine Entscheidung), und die Summe aller Zeilen ist eine Statistik,
-- die niemanden außer dem Verantwortlichen etwas angeht.
drop policy if exists "admin read einwilligungen" on public.einwilligungen;
create policy "admin read einwilligungen"
  on public.einwilligungen for select
  to authenticated
  using ((select private.is_admin()));

-- Kein direkter INSERT für irgendwen — auch nicht für `anon`. Der Weg hinein
-- ist die Funktion unten. Sonst gälte hier derselbe Befund wie am 21.09. bei
-- `inquiries`: Eine öffentliche INSERT-Policy sagt, WER schreiben darf, nie
-- WELCHE SPALTEN (Regel supabase-sicherheit, Punkt 18) — jemand könnte
-- `created_at` rückdatieren und damit einen Nachweis fälschen, der später
-- gegen uns verwendet wird.
revoke all on public.einwilligungen from anon;

create or replace function public.einwilligung_nachweisen(
  p_entscheidung text,
  p_banner_version integer,
  p_kategorien jsonb,
  p_besucher_kennung text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Die Wertprüfungen stehen hier UND als CHECK an der Tabelle. Doppelt, weil
  -- der CHECK die Grenze hält, falls diese Funktion je umgebaut wird, und die
  -- Prüfung hier eine lesbare Fehlermeldung erzeugt statt eines 23514.
  if p_entscheidung not in ('erteilt', 'abgelehnt', 'widerrufen') then
    raise exception 'EINWILLIGUNG_UNBEKANNTE_ENTSCHEIDUNG' using errcode = 'P0001';
  end if;

  if p_besucher_kennung is null or char_length(p_besucher_kennung) not between 8 and 64 then
    raise exception 'EINWILLIGUNG_KENNUNG_UNGUELTIG' using errcode = 'P0001';
  end if;

  -- Notbremse gegen das Volllaufen der Tabelle: Eine Kennung, die in einer
  -- Stunde mehr als 20 Entscheidungen meldet, ist kein Mensch, der seine
  -- Meinung ändert. Still verwerfen statt Fehler werfen — ein Bannerklick darf
  -- nicht mit einer Fehlermeldung enden, und der Nachweis der ersten
  -- Entscheidung steht ja bereits.
  if (
    select count(*) from public.einwilligungen
     where besucher_kennung = p_besucher_kennung
       and created_at > now() - interval '1 hour'
  ) >= 20 then
    return;
  end if;

  insert into public.einwilligungen (entscheidung, banner_version, kategorien, besucher_kennung)
  values (p_entscheidung, p_banner_version, p_kategorien, p_besucher_kennung);
end;
$$;

comment on function public.einwilligung_nachweisen is
  'Einzige Schreibstelle für Einwilligungs-Nachweise. Setzt created_at selbst — '
  'ein rückdatierter Nachweis wäre wertlos.';

-- Diese Funktion MUSS für `anon` aufrufbar sein: Ein Besucher hat kein Konto,
-- und die Einwilligung fällt, bevor irgendetwas anderes passiert. Sie liegt
-- deshalb bewusst in `public` (PostgREST exponiert nur dieses Schema) — anders
-- als `private.audit_schreiben`, die niemand von außen erreichen darf.
-- `authenticated` bekommt sie ebenfalls: Der Admin sieht dasselbe Banner nicht,
-- aber ein angemeldeter Besucher wäre sonst der einzige, dessen Widerruf nicht
-- nachweisbar ist.
grant execute on function public.einwilligung_nachweisen(text, integer, jsonb, text) to anon, authenticated;

-- ── Aufbewahrung ───────────────────────────────────────────────────────────
-- 36 Monate: Die Einwilligung muss so lange nachweisbar sein, wie aus ihr
-- Ansprüche entstehen können; das ist die regelmäßige Verjährung nach
-- § 195 BGB plus Puffer. Danach ist der Nachweis nutzlos und damit unzulässig.

create or replace function private.einwilligungen_aufraeumen()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_anzahl integer;
begin
  delete from public.einwilligungen where created_at < now() - interval '36 months';
  get diagnostics v_anzahl = row_count;
  return v_anzahl;
end;
$$;

revoke execute on function private.einwilligungen_aufraeumen() from public, anon;
grant execute on function private.einwilligungen_aufraeumen() to authenticated;
