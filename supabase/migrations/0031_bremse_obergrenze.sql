-- Obergrenze für die Zählertabelle.
--
-- Aufgefallen beim Lesen des Advisor-Befunds zu 0030: `bremse_zaehlen` ist für
-- `anon` ausführbar — das muss sie sein, weil eine Anmeldung und ein
-- Anfrageformular anonym sind. Wer keine fremde Kennung bilden kann (sie ist
-- `sha256(geheimnis || wert)`), kann damit zwar niemanden aussperren, aber er
-- kann mit Zufallskennungen **Zeilen erzeugen**, bis die Datenbank voll ist.
-- Auf dem Free-Plan mit 500 MB ist das kein theoretischer Ärger.
--
-- Die Antwort ist eine Obergrenze je Fenster, und sie ist bewusst
-- **fail-open**: Ist sie erreicht, wird nicht mehr gezählt und damit auch nicht
-- mehr gebremst — statt dass die Anmeldung stehenbleibt. Begründung wie beim
-- Fehlerfall in `lib/bremse.ts`: Eine hustende Bremse darf die Tür nicht
-- zumauern. Der Fall ist im Server-Log sichtbar, weil die Funktion dann -1
-- zurückgibt und der Aufrufer das protokolliert.
--
-- 5.000 ist so gewählt, dass echtes Verhalten es nie erreicht: Bei drei
-- Admin-Konten und einer Seite mit bisher einer einzigen Anfrage sind das
-- Größenordnungen Luft. Ein Angreifer, der die Grenze reißt, hat damit die
-- Bremse für eine Stunde ausgehebelt — aber die Grenze ist immer noch besser
-- als eine volle Datenbank, und er hat dabei nichts erraten, was ihm hilft.

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
  v_zeilen integer;
begin
  if p_kennung is null or char_length(p_kennung) < 16 then
    return 0;
  end if;

  v_fenster := to_timestamp(
    floor(extract(epoch from now()) / (p_fenster_minuten * 60)) * (p_fenster_minuten * 60)
  );

  -- Erst nachsehen, ob das Fenster schon überfüllt ist. `count(*)` über einen
  -- Index auf `fenster_beginn` ist billig genug für einen Anmeldeversuch.
  select count(*) into v_zeilen
    from public.bremse_zaehler
   where fenster_beginn = v_fenster;

  if v_zeilen >= 5000 then
    -- Nicht zählen, nicht sperren, aber erkennbar machen: -1 heißt für den
    -- Aufrufer „die Bremse ist gerade blind", nicht „alles in Ordnung".
    return -1;
  end if;

  insert into public.bremse_zaehler (kennung, art, fenster_beginn, anzahl)
  values (p_kennung, p_art, v_fenster, 1)
  on conflict (kennung, art, fenster_beginn)
    do update set anzahl = public.bremse_zaehler.anzahl + 1
  returning anzahl into v_anzahl;

  if random() < 0.01 then
    delete from public.bremse_zaehler where fenster_beginn < now() - interval '24 hours';
  end if;

  return v_anzahl;
end;
$$;
