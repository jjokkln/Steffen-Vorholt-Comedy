-- Zentrale Key/Value-Einstellungen der Website.
-- Erster Anwendungsfall: Empfänger-Adressen der Anfragen-Benachrichtigungen an Steffen,
-- damit sie im Admin-Dashboard pflegbar sind statt in Env-Variablen zu stecken.
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Bewusst NUR die `notify_email_*`-Schlüssel sind anon-lesbar: Das öffentliche Anfrage-
-- formular läuft mit dem anon-Key und muss beim Absenden wissen, wohin die Admin-Mail geht.
-- Es sind Geschäfts-Kontaktadressen (stehen ohnehin im Impressum), keine Fremddaten.
-- Alle anderen (künftigen) Settings-Keys bleiben damit automatisch admin-only.
create policy "public read notify email settings" on public.site_settings
  for select using (starts_with(key, 'notify_email_'));

create policy "admin all site_settings" on public.site_settings
  for all to authenticated using (true) with check (true);

-- Startwerte = die bisher im Code hinterlegten Adressen, damit sich das Verhalten nicht ändert.
insert into public.site_settings (key, value) values
  ('notify_email_shows',   'Steffen.vorholt.comedyshows@gmail.com'),
  ('notify_email_booking', 'Steffen.vorholt.comedybooking@gmail.com'),
  ('notify_email_all',     '')
on conflict (key) do nothing;
