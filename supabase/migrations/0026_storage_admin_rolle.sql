-- Fortsetzung von 0025 für die drei Medien-Buckets.
--
-- Der Supabase-Advisor meldet diese drei Policies NICHT — ihr Ausdruck ist
-- `bucket_id in ('planets','gallery','media')` und damit nicht literal `true`. Die
-- Berechtigungsfrage ist trotzdem dieselbe: geprüft wird, WELCHER Bucket, nie WER.
-- Jedes angemeldete Konto darf Dateien hochladen, überschreiben und löschen.
--
-- Ohne diesen Nachzug wäre die Admin-Rolle halb eingeführt: Ein zweites Auth-Konto käme
-- nach 0025 an keine einzige Tabelle mehr, könnte aber weiterhin Steffens Bühnenfotos
-- löschen. Die Buckets sind öffentlich lesbar — die Lese-Policy bleibt deshalb unberührt.
--
-- Getrennt von 0025 gehalten, damit sich dieser Teil einzeln zurücknehmen lässt, falls der
-- Medien-Upload danach klemmt.

do $$
declare
  r           record;
  erwartet    text := 'bucket_id in (''planets''::text, ''gallery''::text, ''media''::text)';
  umgestellt  int := 0;
  schon_gut   int := 0;
begin
  for r in
    select policyname, qual, with_check, cmd
      from pg_policies
     where schemaname = 'storage'
       and tablename  = 'objects'
       and policyname like 'admin % media buckets'
     order by policyname
  loop
    if coalesce(r.qual, '') like '%is_admin%'
       or coalesce(r.with_check, '') like '%is_admin%' then
      schon_gut := schon_gut + 1;
      continue;
    end if;

    -- Der Bucket-Filter bleibt erhalten und bekommt die Rollenprüfung DANEBEN, nicht
    -- darüber: ein `or` am äußeren Ende würde die Bucket-Grenze aufheben
    -- (Regel supabase-sicherheit, Punkt 17). Deshalb ausdrücklich `and`.
    if r.cmd = 'INSERT' then
      execute format(
        'alter policy %I on storage.objects with check (%s and (select public.is_admin()))',
        r.policyname, coalesce(r.with_check, 'true'));
    else
      execute format(
        'alter policy %I on storage.objects using (%s and (select public.is_admin()))',
        r.policyname, coalesce(r.qual, 'true'));
    end if;
    umgestellt := umgestellt + 1;
  end loop;

  if umgestellt + schon_gut <> 3 then
    raise exception
      'Erwartet waren 3 Storage-Admin-Policies (insert/update/delete), gefunden %. Abbruch.',
      umgestellt + schon_gut;
  end if;

  raise notice 'Storage-Policies: % umgestellt, % waren es schon.', umgestellt, schon_gut;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Rücknahme (SQL-Editor im Dashboard)
-- ─────────────────────────────────────────────────────────────
-- alter policy "admin insert media buckets" on storage.objects
--   with check (bucket_id in ('planets','gallery','media'));
-- alter policy "admin update media buckets" on storage.objects
--   using (bucket_id in ('planets','gallery','media'));
-- alter policy "admin delete media buckets" on storage.objects
--   using (bucket_id in ('planets','gallery','media'));
