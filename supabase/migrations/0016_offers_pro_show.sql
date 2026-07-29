-- Angebote gehören ab jetzt zu einer Show, nicht mehr zu einer eigenen /angebote-Seite.
-- Der Admin pflegt sie unter /admin/shows/<id>; öffentlich erscheinen sie als Sektion
-- auf der jeweiligen Show-Seite (Promo-Codes, die auf den Ticketseiten eingelöst werden).
alter table public.offers
  add column if not exists show_id uuid references public.shows(id) on delete cascade;

create index if not exists offers_show_id_idx on public.offers (show_id);

comment on column public.offers.show_id is
  'Show, zu der das Angebot gehört. NULL = Altbestand aus der früheren /angebote-Seite; wird nirgends mehr angezeigt.';
