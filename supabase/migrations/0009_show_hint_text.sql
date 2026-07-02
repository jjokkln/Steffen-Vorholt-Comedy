-- Kleiner Aktions-/Hinweistext pro Show (z. B. „Mit Code XY zahlst du nur 5 €").
-- Bewusst nur ein Freitextfeld – keine Code-Einlöse-Mechanik.
alter table public.shows
  add column if not exists hint_text text not null default '';
