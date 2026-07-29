-- Poster-Plätze für die beiden Bühnen-Videos (Startseite und „Über Steffen").
--
-- Warum: Die Videos laden seit dem 30.07.2026 mit `preload="none"` erst beim Hinscrollen
-- (Egress-Maßnahme, siehe context/troubleshooting.md). Ohne Standbild bleibt die Fläche
-- bis dahin schwarz. Ein Poster ist ein Bild und läuft damit über die Next/Vercel-
-- Bildoptimierung — es kostet einen Bruchteil dessen, was ein Video-Vorabladen kostet.
--
-- Leer angelegt: Solange kein Poster hochgeladen ist, verhält sich die Seite wie bisher.
insert into site_media (key, file_path) values
  ('home_portrait_poster', ''),
  ('steffen_portrait_poster', '')
on conflict (key) do nothing;
