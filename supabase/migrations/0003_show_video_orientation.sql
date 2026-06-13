-- Format pro Show-Video: Quer- (16:9) oder Hochformat (9:16), bestimmt die Darstellung
alter table public.show_videos
  add column if not exists orientation text not null default 'landscape'
  check (orientation in ('landscape', 'portrait'));
