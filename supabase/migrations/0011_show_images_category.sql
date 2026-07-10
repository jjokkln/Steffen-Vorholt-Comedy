-- Kategorie pro Show-Foto für getrennte Galerie-Ansichten auf der Show-Subpage.
-- Erlaubte Werte werden in der App validiert: 'location' | 'show'.
-- Default 'show' → bestehende Fotos bleiben in der Show-Galerie.
alter table public.show_images
  add column if not exists category text not null default 'show';
