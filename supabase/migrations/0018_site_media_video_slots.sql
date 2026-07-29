-- Aus dem einen „Hero-Video" werden benannte Video-Plätze.
--
-- Vorher gab es genau einen Schlüssel `hero_video`, der an zwei völlig verschiedenen
-- Stellen ausgespielt wurde (Porträt-Bereich der Startseite UND der /steffen-Seite),
-- während der vollflächige Trailer unter dem Hero gar nicht pflegbar war — er stand
-- als Dateipfad im Code (components/home/HeroTrailer.tsx).
--
-- Ab jetzt hat jeder Platz auf der Website seinen eigenen Schlüssel. Die Registry dazu
-- steht in lib/site-media.ts; sie definiert auch die Fallback-Kette, damit die Website
-- auch dann funktioniert, wenn ein Platz leer ist.

-- 1. Bestand übernehmen: das bisherige Hero-Video ist inhaltlich das Porträt-Video
--    der Startseite. Umbenennen statt kopieren, damit kein Duplikat entsteht.
update public.site_media set key = 'home_portrait_video', updated_at = now()
where key = 'hero_video';

-- 2. Neue Plätze anlegen. Startwerte = die bisher im Code hinterlegten Dateien, damit
--    sich am Erscheinungsbild der Website durch diese Migration nichts ändert.
--    (Führender "/" = lokale Datei aus public/, sonst Storage-Pfad "bucket/datei" —
--    Konvention aus lib/media.ts.)
insert into public.site_media (key, file_path) values
  ('home_trailer_video',     '/assets/media/steffen/steffen-trailer.mp4'),
  ('home_trailer_poster',    '/assets/media/steffen/steffen-trailer-poster.webp'),
  ('steffen_portrait_video', '')
on conflict (key) do nothing;
