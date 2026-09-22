-- Eine Bremse für zwei Strecken: die Anmeldung und das öffentliche Anfrageformular.
--
-- ── Was heute fehlt ────────────────────────────────────────────────────────
--
-- 1. **Der Admin-Login hat keine Bremse, die den Angreifer trifft**
--    (Pflichtkern 11.4). `login()` ist eine Server Action, `signInWithPassword`
--    läuft also auf Vercel — GoTrue sieht **Vercels** IP, nicht die des
--    Anfragenden. Die eingebaute Bremse existiert (gemessen am 21.09.2026: 429
--    ab dem 38. Fehlversuch aus einer IP), trifft aber entweder niemanden oder
--    alle Admins gemeinsam. Seit dem 22.09.2026 sind das drei Konten.
-- 2. **Der globale Deckel am Anfrageformular ist auch ein Abschaltknopf.**
--    Migration 0021 blockt bei 60 Anfragen/Stunde ALLE weiteren, auch echte.
--    Ein Angreifer kauft mit 60 Requests eine Stunde lang jede Buchungsanfrage
--    weg. Die 5/Adresse ist richtig; dem globalen Deckel fehlt die
--    **Quellen**-Dimension.
--
-- ── Warum die Kennung ein Hash ist, und was das löst ───────────────────────
--
-- Die Vorlage (boltwork, Baustein „Anfrage-Bremse-Auth") ruft die Zählfunktion
-- mit Service-Role auf; für `anon` ist sie dort gesperrt. Dieses Projekt hat
-- keinen Service-Role-Client und soll keinen bekommen — ein solcher Schlüssel
-- in der Vercel-Umgebung umgeht die RLS des gesamten Projekts.
--
-- Eine für `anon` freigegebene Zählfunktion hätte aber ein Problem, das die
-- Regel auth-haertung ausdrücklich benennt: Eine Kontosperre ist auch ein
-- **Aussperr-Werkzeug**. Wer die Kennung kennt, sperrt gezielt aus.
--
-- Deshalb ist die Kennung nie die IP oder die Adresse selbst, sondern
-- `sha256(geheimnis || wert)`. Das Geheimnis (`BREMSE_GEHEIMNIS`) steht nur in
-- der Server-Umgebung. Ein Angreifer kann damit die Kennung einer fremden
-- Person **nicht bilden** und niemanden aussperren — er kann nur seinen eigenen
-- Eimer füllen, und genau das soll er.
--
-- Nebeneffekt, der dazugehört: In der Tabelle steht keine IP und keine
-- E-Mail-Adresse, sondern ein nicht zurückrechenbarer Wert mit einer Stunde
-- Lebensdauer. Das ist dieselbe Denkweise wie beim Einwilligungs-Nachweis in
-- 0029 — ein Protokoll bekommt nur die Felder, die es braucht.

-- ── Tabelle ────────────────────────────────────────────────────────────────

create table if not exists public.bremse_zaehler (
  -- Fixed Window: Kennung + Art + Fensterbeginn ist der Schlüssel. Ein
  -- Sliding Window bräuchte eine Zeile je Versuch; hier genügt eine je Fenster.
  kennung text not null,
  art text not null,
  fenster_beginn timestamptz not null,
  anzahl integer not null default 0,
  primary key (kennung, art, fenster_beginn)
);

comment on table public.bremse_zaehler is
  'Fehlversuchs-Zähler für Anmeldung und Anfrageformular. Kennung ist ein gesalzener Hash, '
  'kein Klartext. Zeilen älter als 24 Stunden werden beim Zählen weggeräumt.';

create index if not exists bremse_zaehler_fenster_idx on public.bremse_zaehler (fenster_beginn);

-- RLS an, **keine** Policy: Auf die Tabelle kommt niemand direkt, weder `anon`
-- noch `authenticated`. Der einzige Weg sind die Funktionen unten.
--
-- ⚠️ Der Grund, warum das so und nicht anders geht (Regel auth-haertung,
-- Punkt 2): Stünde die Zählertabelle unter der RLS derjenigen, die sie bremst,
-- verschluckt eine fehlschlagende Policy das Hochzählen **still** — 0 Zeilen,
-- kein Fehler — und die Bremse wäre lautlos wirkungslos.
alter table public.bremse_zaehler enable row level security;
revoke all on public.bremse_zaehler from anon, authenticated;

-- ── Zählen und prüfen in EINEM Statement ───────────────────────────────────

create or replace function public.bremse_zaehlen(
  p_kennung text,
  p_art text,
  p_fenster_minuten integer
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fenster timestamptz;
  v_anzahl integer;
begin
  if p_kennung is null or char_length(p_kennung) < 16 then
    -- Keine (oder eine offensichtlich ungültige) Kennung wird NICHT gezählt.
    -- Eine Sammelkennung würde alle Anfragen in einen Eimer werfen: Die erste
    -- Person, die sich vertippt, sperrte alle anderen aus (auth-haertung, Punkt 3).
    return 0;
  end if;

  -- Fensterbeginn abrunden, damit dieselbe Minute immer denselben Schlüssel ergibt.
  v_fenster := to_timestamp(
    floor(extract(epoch from now()) / (p_fenster_minuten * 60)) * (p_fenster_minuten * 60)
  );

  -- Zählen und Lesen in einem Statement. Ein Read-then-Write in TypeScript wäre
  -- eine Race Condition: n parallele Anfragen lesen denselben Wert, schreiben
  -- dieselbe Zahl, niemand wird gebremst.
  insert into public.bremse_zaehler (kennung, art, fenster_beginn, anzahl)
  values (p_kennung, p_art, v_fenster, 1)
  on conflict (kennung, art, fenster_beginn)
    do update set anzahl = public.bremse_zaehler.anzahl + 1
  returning anzahl into v_anzahl;

  -- Beiläufig aufräumen. Ohne das wächst die Tabelle unbegrenzt, und ein
  -- eigener Cron-Job für drei Zeilen am Tag wäre Aufwand ohne Gegenwert.
  -- `random()` statt jedes Mal: Aufräumen ist teurer als Zählen.
  if random() < 0.01 then
    delete from public.bremse_zaehler where fenster_beginn < now() - interval '24 hours';
  end if;

  return v_anzahl;
end;
$$;

-- ── Stand lesen, OHNE zu zählen ────────────────────────────────────────────
--
-- ⚠️ Die zweite Funktion ist kein Komfort, sie ist der Unterschied zwischen
-- einer Bremse und einer Selbstsperre (auth-haertung, Punkt 3.2): Zählte schon
-- die Vorabprüfung mit, verbrauchte **jeder erfolgreiche Login** Budget. Mit
-- nur einer Zählfunktion baut man diesen Fehler zwangsläufig ein.

create or replace function public.bremse_stand(
  p_kennung text,
  p_art text,
  p_fenster_minuten integer
)
returns integer
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_fenster timestamptz;
begin
  if p_kennung is null or char_length(p_kennung) < 16 then
    return 0;
  end if;

  v_fenster := to_timestamp(
    floor(extract(epoch from now()) / (p_fenster_minuten * 60)) * (p_fenster_minuten * 60)
  );

  return coalesce((
    select anzahl from public.bremse_zaehler
     where kennung = p_kennung and art = p_art and fenster_beginn = v_fenster
  ), 0);
end;
$$;

-- ── Zurücksetzen nach erfolgreichem Versuch ────────────────────────────────
-- Damit eine vertippte Eingabe kein Budget kostet, wenn die zweite stimmt.

create or replace function public.bremse_zuruecksetzen(
  p_kennung text,
  p_art text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_kennung is null or char_length(p_kennung) < 16 then
    return;
  end if;
  delete from public.bremse_zaehler where kennung = p_kennung and art = p_art;
end;
$$;

-- Alle drei müssen für `anon` aufrufbar sein — eine Anmeldung und ein
-- Anfrageformular sind anonym. Der Schutz liegt nicht im Entzug, sondern darin,
-- dass die Kennung ohne das Server-Geheimnis nicht zu bilden ist (siehe Kopf).
grant execute on function public.bremse_zaehlen(text, text, integer) to anon, authenticated;
grant execute on function public.bremse_stand(text, text, integer) to anon, authenticated;
grant execute on function public.bremse_zuruecksetzen(text, text) to anon, authenticated;

-- ── Die Quellen-Dimension für das Anfrageformular ──────────────────────────
--
-- Der globale Deckel aus 0021 bleibt, steigt aber von 60 auf 200: Er ist die
-- Notbremse gegen einen entgleisten Bot, nicht die eigentliche Grenze. Die
-- eigentliche Grenze zählt jetzt je **Quelle** und steht in der Server Action
-- (`lib/anfrage-bremse.ts`), weil nur dort die IP bekannt ist — ein Trigger in
-- der Datenbank sieht sie nicht.
--
-- Warum 200: Die Seite hatte am 30.07.2026 insgesamt **eine** Anfrage. 200 in
-- einer Stunde ist von echtem Verhalten so weit entfernt, dass der Deckel als
-- Abschaltknopf ausscheidet, und von einer Mail-Bombe so weit, dass er sie
-- immer noch stoppt (bei 2 Mails je Anfrage sind 200 Anfragen 400 Mails gegen
-- ein Gmail-Tageslimit von ~500).

create or replace function public.inquiries_missbrauchsschutz()
returns trigger
language plpgsql
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

  -- Angehoben von 60 auf 200 am 22.09.2026, siehe Kopf dieser Migration.
  if gesamt >= 200 then
    raise exception 'ANFRAGE_LIMIT_GESAMT' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
