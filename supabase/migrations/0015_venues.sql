-- Spielorte als eigene Tabelle. Ersetzt das Teilstring-Matching auf Stadtnamen
-- (lib/nrw-geo.ts, CITY_COORDS): stand ein Ort nicht in der Liste, fiel er
-- stillschweigend von der Karte. Koordinaten werden jetzt im Admin-Modus der
-- Karte per Klick gesetzt und hier gespeichert.
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  venue text not null default 'Location folgt',
  lat  double precision not null,
  lng  double precision not null,
  -- Über den Handoff hinaus: die Markerfarbe ist laut Design die Show-Farbe, und
  -- ein neu angelegter Ort hat noch keinen Termin, aus dem sie sich ableiten
  -- ließe. Das Show-Select im Formular schreibt deshalb hierhin. Optional —
  -- ohne Zuordnung fällt die Karte auf die Farbe des nächsten Termins zurück.
  show_id uuid references public.shows(id) on delete set null,
  created_at timestamptz not null default now()
);

-- on delete set null statt Default: einen Spielort zu löschen darf nie Termine
-- mitreißen. Die Server Action verweigert das Löschen ohnehin, solange Termine
-- daran hängen — das hier ist das Netz darunter.
alter table public.events add column venue_id uuid references public.venues(id) on delete set null;
create index events_venue_id_idx on public.events (venue_id);

alter table public.venues enable row level security;

create policy "public read venues" on public.venues for select using (true);
create policy "admin all venues" on public.venues for all to authenticated using (true) with check (true);
