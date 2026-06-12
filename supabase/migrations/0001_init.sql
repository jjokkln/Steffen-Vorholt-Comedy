-- Tabellen
create table public.shows (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  format_label text not null default '',
  color text not null default '#7CFF6B',
  planet_image_path text not null default '',
  principle_items jsonb not null default '[]',
  cities_text text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  date date not null,
  start_time text not null default '',
  entry_time text not null default '',
  city text not null,
  venue text not null default '',
  ticket_url text not null default '',
  provider text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('booking','comedian')),
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null default '',
  payload jsonb not null default '{}',
  status text not null default 'new' check (status in ('new','read','answered')),
  created_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.one_liners (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.legal_pages (
  slug text primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

create table public.site_media (
  key text primary key,
  file_path text not null,
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.shows enable row level security;
alter table public.events enable row level security;
alter table public.inquiries enable row level security;
alter table public.gallery_items enable row level security;
alter table public.one_liners enable row level security;
alter table public.legal_pages enable row level security;
alter table public.site_media enable row level security;

create policy "public read shows" on public.shows for select using (true);
create policy "public read events" on public.events for select using (is_published);
create policy "public insert inquiries" on public.inquiries for insert with check (true);
create policy "public read gallery" on public.gallery_items for select using (true);
create policy "public read one_liners" on public.one_liners for select using (is_active);
create policy "public read legal" on public.legal_pages for select using (true);
create policy "public read site_media" on public.site_media for select using (true);

create policy "admin all shows" on public.shows for all to authenticated using (true) with check (true);
create policy "admin all events" on public.events for all to authenticated using (true) with check (true);
create policy "admin all inquiries" on public.inquiries for all to authenticated using (true) with check (true);
create policy "admin all gallery" on public.gallery_items for all to authenticated using (true) with check (true);
create policy "admin all one_liners" on public.one_liners for all to authenticated using (true) with check (true);
create policy "admin all legal" on public.legal_pages for all to authenticated using (true) with check (true);
create policy "admin all site_media" on public.site_media for all to authenticated using (true) with check (true);

-- Storage-Buckets (öffentlich lesbar, Schreiben nur authentifiziert)
insert into storage.buckets (id, name, public) values
  ('planets','planets', true), ('gallery','gallery', true), ('media','media', true);

create policy "public read media buckets" on storage.objects for select
  using (bucket_id in ('planets','gallery','media'));
create policy "admin insert media buckets" on storage.objects for insert to authenticated
  with check (bucket_id in ('planets','gallery','media'));
create policy "admin update media buckets" on storage.objects for update to authenticated
  using (bucket_id in ('planets','gallery','media'));
create policy "admin delete media buckets" on storage.objects for delete to authenticated
  using (bucket_id in ('planets','gallery','media'));
