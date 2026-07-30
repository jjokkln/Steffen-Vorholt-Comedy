-- Zwei Härtungen aus der Abnahme vom 30.07.2026.

-- ─────────────────────────────────────────────────────────────
-- 1. `show_images` an die RLS-Konvention angleichen
-- ─────────────────────────────────────────────────────────────
-- Bisher (Migration 0004) war die Admin-Policy die einzige im Projekt, die für die Rolle
-- `public` gilt und die Berechtigung im Ausdruck prüft (`auth.role() = 'authenticated'`),
-- statt wie alle anderen `to authenticated` zu verwenden.
--
-- Die Wirkung war dieselbe — `anon` scheitert am Ausdruck —, aber sie hing an `auth.role()`,
-- einer Alt-Helferfunktion, die Supabase nicht mehr dokumentiert. Fällt sie weg, wird der
-- Ausdruck beim Query-Planen zum Fehler, und dann bricht nicht nur das Schreiben, sondern auch
-- das LESEN der Show-Bilder (Postgres wertet alle für die Operation geltenden Policies aus,
-- nicht nur die, die am Ende greift). Genau diese Bauart hat in einem anderen Projekt schon
-- „permission denied for function" für `anon` verursacht.
--
-- Namen werden gleichzeitig sprechend gemacht ("public read"/"admin all" waren die einzigen
-- Policies im Projekt ohne Tabellenbezug im Namen).
drop policy if exists "admin all" on public.show_images;
drop policy if exists "public read" on public.show_images;

create policy "public read show_images" on public.show_images
  for select using (true);
create policy "admin all show_images" on public.show_images
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- 2. Storage-Buckets: Größen- und Typgrenzen
-- ─────────────────────────────────────────────────────────────
-- Vorher: kein `file_size_limit`, keine `allowed_mime_types`. Zwei Folgen:
--
--   a) Der Free-Plan hat 1 GB Datei-Storage (Bestand am 30.07.2026: ~116 MB). `lib/video-compress.ts`
--      lädt bei jedem Fehlschlag der Komprimierung still das ORIGINAL hoch — ein 300-MB-Handyvideo
--      hätte das Kontingent in einem Zug gesprengt, ohne Warnung. 50 MB lassen jedes realistische
--      Original durch (größte Datei bisher: 16 MB) und fangen den Unfall ab. Ein Upload darüber
--      scheitert jetzt sichtbar, statt leise das Kontingent zu fressen.
--
--   b) Die Buckets sind öffentlich lesbar. `image/svg+xml` fehlt deshalb bewusst in der Liste:
--      Eine SVG-Datei kann Skript enthalten und würde direkt von der Storage-Domain ausgeliefert.
--      Gebraucht wird sie nicht — hochgeladen werden Fotos und Videos, die Marken-Icons liegen
--      statisch in `public/`.
--
-- Die Liste deckt alles ab, was die Upload-Komponenten anbieten (`image/*`, `video/mp4,video/*`)
-- und was `video-compress.ts` erzeugen kann (MP4 in Chrome, WebM als Rückfall).
update storage.buckets
   set file_size_limit = 52428800,   -- 50 MiB
       allowed_mime_types = array[
         'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif',
         'video/mp4', 'video/webm', 'video/quicktime'
       ]
 where id in ('media', 'gallery', 'planets');
