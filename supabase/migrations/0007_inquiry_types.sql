-- Drei getrennte Kontakt-Formulare statt zwei.
-- Alte Werte ('booking','comedian') bleiben für bestehende Zeilen gültig.
alter table public.inquiries drop constraint if exists inquiries_type_check;
alter table public.inquiries add constraint inquiries_type_check
  check (type in ('booking', 'comedian', 'booking_show', 'booking_steffen', 'frage_feedback'));
