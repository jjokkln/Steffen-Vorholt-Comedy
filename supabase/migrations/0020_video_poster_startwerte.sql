-- Startwerte für die Video-Vorschaubilder (30.07.2026).
--
-- Die Bilder sind aus dem jeweiligen Video selbst extrahiert (erster aussagekräftiger Frame,
-- auf das Anzeige-Seitenverhältnis zugeschnitten) und liegen in public/ — sie kommen damit
-- vom Vercel-CDN und kosten null Supabase-Egress. 15 kB bzw. 75 kB statt 6,4 MB bzw. 16 MB
-- Video-Vorabladen pro Seitenaufruf.
--
-- Warum überhaupt nötig: Seit der Egress-Runde am 30.07.2026 laden Videos mit
-- `preload="none"` erst beim Hinscrollen. Ohne Standbild bliebe die Fläche bis dahin
-- schwarz. Details in context/troubleshooting.md.
--
-- Beide Werte sind im Admin überschreibbar; das hier ist nur der Startzustand.

update site_media
   set file_path = '/assets/media/steffen/steffen-portrait-poster.webp',
       updated_at = now()
 where key = 'home_portrait_poster'
   and file_path = '';

-- Über `video_path` statt über die ID gematcht, damit die Migration keine generierte ID
-- hartcodiert und auf einer frisch aufgesetzten Umgebung einfach nichts tut.
update show_videos
   set poster_path = '/assets/media/shows/comedy-eiskalt/comedy-eiskalt-video-poster.webp'
 where video_path = 'media/show-video-1781355885258-3n1ltb.mp4'
   and coalesce(poster_path, '') = '';
