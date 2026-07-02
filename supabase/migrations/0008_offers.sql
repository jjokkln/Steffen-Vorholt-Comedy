-- Angebote / Aktuelle Aktionen (z. B. Rettember, Missions Pass) — im Admin pflegbar.
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  image_path text not null default '',
  code text not null default '',
  validity text not null default '',
  url text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;

create policy "public read offers" on public.offers for select using (is_active);
create policy "admin all offers" on public.offers for all to authenticated using (true) with check (true);
