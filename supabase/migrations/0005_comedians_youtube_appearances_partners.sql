-- Comedians (Kollegen / Ensemble) — im Admin pflegbar
create table public.comedians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int,
  bio text not null default '',
  photo_path text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  youtube_url text not null default '',
  website_url text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Zuordnung Comedians <-> Shows (Teilnehmer/Cast)
create table public.show_comedians (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  comedian_id uuid not null references public.comedians(id) on delete cascade,
  role text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (show_id, comedian_id)
);

-- YouTube-Videos: show_id NULL = globale Referenz (Homepage/Comedian/Archiv),
-- show_id gesetzt = Video einer bestimmten Show-Unterseite
create table public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  show_id uuid references public.shows(id) on delete cascade,
  youtube_id text not null,
  title text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Steffens externe Auftritte / Open Mics / Gastauftritte (Profilseite)
create table public.appearances (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organizer text not null default '',
  city text not null default '',
  venue text not null default '',
  date date,
  url text not null default '',
  kind text not null default 'guest' check (kind in ('open_mic','guest','gig','show')),
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Partner / Veranstalter
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null default '',
  logo_path text not null default '',
  description text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indizes für die häufigen Filter
create index idx_show_comedians_show on public.show_comedians(show_id);
create index idx_youtube_videos_show on public.youtube_videos(show_id);

-- RLS
alter table public.comedians enable row level security;
alter table public.show_comedians enable row level security;
alter table public.youtube_videos enable row level security;
alter table public.appearances enable row level security;
alter table public.partners enable row level security;

create policy "public read comedians" on public.comedians for select using (is_active);
create policy "public read show_comedians" on public.show_comedians for select using (true);
create policy "public read youtube_videos" on public.youtube_videos for select using (true);
create policy "public read appearances" on public.appearances for select using (is_published);
create policy "public read partners" on public.partners for select using (is_active);

create policy "admin all comedians" on public.comedians for all to authenticated using (true) with check (true);
create policy "admin all show_comedians" on public.show_comedians for all to authenticated using (true) with check (true);
create policy "admin all youtube_videos" on public.youtube_videos for all to authenticated using (true) with check (true);
create policy "admin all appearances" on public.appearances for all to authenticated using (true) with check (true);
create policy "admin all partners" on public.partners for all to authenticated using (true) with check (true);
