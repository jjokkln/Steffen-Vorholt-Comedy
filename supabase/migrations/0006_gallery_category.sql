-- Galerie-Kategorien (Steffen / Shows / Locations) für die Seite „Galerie & Gästebuch".
-- Leerer String = unkategorisiert (wird unter „Weitere Eindrücke" gruppiert).
alter table public.gallery_items
  add column if not exists category text not null default '';
