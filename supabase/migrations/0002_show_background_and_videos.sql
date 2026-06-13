-- Hintergrundbild pro Show (liegt hinter der ganzen Show-Seite)
alter table public.shows
  add column if not exists background_image_path text not null default '';

-- Videos pro Show (öffentlich sichtbar, Reihenfolge via sort_order)
create table if not exists public.show_videos (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  video_path text not null,
  poster_path text not null default '',
  title text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists show_videos_show_id_idx
  on public.show_videos (show_id, sort_order);

-- RLS: öffentlich lesbar, schreiben nur für authentifizierte Admins
alter table public.show_videos enable row level security;

create policy "public read show_videos" on public.show_videos
  for select using (true);
create policy "admin all show_videos" on public.show_videos
  for all to authenticated using (true) with check (true);

-- Hinweis: Hintergrundbilder und Videos nutzen den bestehenden Bucket "media";
-- dessen Storage-Policies (lesen öffentlich, schreiben authentifiziert) decken das ab.
