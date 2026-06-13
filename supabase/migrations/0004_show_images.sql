-- Titelbild pro Show (erscheint prominent in der Hero-Section der Show-Subpage)
alter table public.shows add column if not exists header_image_path text not null default '';

-- Fotogalerie pro Show
create table if not exists public.show_images (
  id          uuid        primary key default gen_random_uuid(),
  show_id     uuid        not null references public.shows(id) on delete cascade,
  image_path  text        not null,
  alt_text    text        not null default '',
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.show_images enable row level security;
create policy "public read"  on public.show_images for select using (true);
create policy "admin all"    on public.show_images for all    using (auth.role() = 'authenticated');
