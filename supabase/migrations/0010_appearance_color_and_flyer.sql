-- Auftritte („Wo Steffen selbst auf der Bühne steht"): pro Eintrag eine
-- Akzentfarbe und ein optionaler Flyer/Bild. Farbe steuert den Karten-Akzent,
-- flyer_path zeigt den Flyer groß auf der Karte (Fallback-Icon, wenn leer).
alter table public.appearances
  add column if not exists color text not null default '#7CFF6B',
  add column if not exists flyer_path text not null default '';
