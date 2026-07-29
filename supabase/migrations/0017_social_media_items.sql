-- Social-Media-Abschnitt der Galerie-Seite.
--
-- Bewusst NICHT an youtube_videos angehängt: dort steckt genau eine Plattform in
-- der Spalte (youtube_id) und die Videos hängen an Shows. Hier geht es um
-- gemischte Quellen (YouTube / Instagram / TikTok / Facebook / …) und um zwei
-- Sorten Eintrag — ein einzelnes Video oder ein ganzer Kanal.
--
-- `platform` ist absichtlich ohne CHECK-Constraint: die erlaubten Werte stehen in
-- lib/social.ts (SOCIAL_PLATFORMS) und werden von der Server Action geprüft.
-- Eine neue Plattform soll ein Frontend-Commit sein, keine Migration; unbekannte
-- Werte fallen in der Anzeige auf das Website-Icon zurück.
create table public.social_media_items (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'youtube',
  -- 'video' = einzelner Beitrag (wird eingebettet oder als Kachel verlinkt),
  -- 'channel' = Profil/Kanal (wird als Chip verlinkt).
  kind text not null default 'video' check (kind in ('video', 'channel')),
  title text not null default '',
  description text not null default '',
  url text not null default '',
  -- Vorschaubild für Beiträge, die sich nicht einbetten lassen (X, LinkedIn,
  -- Kurzlinks). Ohne Bild zeigt die Kachel den Plattform-Verlauf.
  thumbnail_path text not null default '',
  orientation text not null default 'landscape' check (orientation in ('landscape', 'portrait')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_social_media_items_sort on public.social_media_items (sort_order);

alter table public.social_media_items enable row level security;

-- Wie bei partners/comedians: öffentlich sind nur aktive Einträge. Kein
-- Funktionsaufruf in der anon-Policy (siehe Regel „Supabase-Sicherheit" Punkt 7).
create policy "public read social_media_items" on public.social_media_items
  for select using (is_active);

create policy "admin all social_media_items" on public.social_media_items
  for all to authenticated using (true) with check (true);
