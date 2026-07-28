-- Bestandsdateien im Storage trugen alle `max-age=3600`: Besucher haben Bilder und Videos
-- also stündlich neu geladen, was das Cached-Egress-Kontingent gesprengt hat. Ab jetzt setzt
-- lib/upload.ts beim Upload `cacheControl: 31536000`; diese Migration zieht den Bestand nach.
--
-- Unbedenklich, weil jeder Dateiname einen Zeitstempel plus Zufallssuffix trägt und
-- `upsert:false` ein Überschreiben ausschließt — eine URL zeigt für immer auf denselben Inhalt.
--
-- ACHTUNG: Ein Schreibzugriff per SQL löst KEINE Invalidierung der Supabase-Smart-CDN aus
-- (das macht nur die Storage-API). Bereits im CDN liegende Antworten liefern den alten
-- Header weiter, bis ihr Edge-Eintrag abläuft. Für Bilder ist das ohne Belang — die laufen
-- seit dem Umbau über die Bild-Optimierung von Next/Vercel, die ihren eigenen
-- `minimumCacheTTL` von 31 Tagen nutzt. Relevant bleibt es nur für die direkt
-- ausgelieferten Videodateien; die sind beim nächsten Neu-Upload sofort korrekt.

update storage.objects
set metadata = jsonb_set(metadata, '{cacheControl}', '"max-age=31536000"')
where metadata ? 'cacheControl'
  and metadata->>'cacheControl' <> 'max-age=31536000';
