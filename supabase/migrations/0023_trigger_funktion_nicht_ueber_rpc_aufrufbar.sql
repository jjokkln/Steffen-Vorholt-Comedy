-- Nachtrag zu 0021: Die Trigger-Funktion war über /rest/v1/rpc/ aufrufbar (Supabase-Advisor
-- 0028/0029). Ein direkter Aufruf würde ohnehin scheitern — Postgres lehnt Trigger-Funktionen
-- außerhalb eines Triggers ab —, aber eine SECURITY-DEFINER-Funktion hat in der öffentlichen
-- API nichts zu suchen. Der Trigger selbst braucht kein EXECUTE-Recht: Postgres prüft das
-- beim CREATE TRIGGER, nicht beim Feuern.
--
-- Diese Datei wurde am 30.07.2026 aus `supabase_migrations.schema_migrations` nachgeschrieben:
-- Die Migration war in der Datenbank angewendet, aber nie als Datei im Repo abgelegt. Ohne sie
-- hätte eine frisch aufgesetzte Umgebung die Funktion weiterhin öffentlich ausführbar gehabt.
revoke execute on function public.inquiries_missbrauchsschutz() from anon, authenticated, public;
