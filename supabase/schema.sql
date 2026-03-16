create table if not exists public.bins (
  id text primary key,
  device_id text unique not null,
  name text not null,
  location text not null,
  area text not null,
  status text not null check (status in ('normal', 'full', 'collecting')),
  fullness_percent integer not null default 0 check (fullness_percent >= 0 and fullness_percent <= 100),
  threshold_percent integer not null default 70 check (threshold_percent >= 0 and threshold_percent <= 100),
  last_signal_at timestamptz,
  last_collection_time timestamptz,
  notes text
);

create table if not exists public.bin_events (
  id uuid primary key default gen_random_uuid(),
  bin_id text not null references public.bins(id) on delete cascade,
  device_id text not null,
  type text not null check (type in ('bin_full', 'collected', 'status_reset')),
  created_at timestamptz not null default timezone('utc', now()),
  source text not null check (source in ('rf-webhook', 'operator')),
  message text not null
);

create index if not exists idx_bin_events_bin_id on public.bin_events(bin_id);
create index if not exists idx_bin_events_created_at on public.bin_events(created_at desc);

insert into public.bins (
  id,
  device_id,
  name,
  location,
  area,
  status,
  fullness_percent,
  threshold_percent,
  last_signal_at,
  last_collection_time,
  notes
)
values
  (
    'bin-01',
    'esp32-bin-01',
    'Downtown Plaza',
    'Gate A, Downtown Plaza',
    'Central District',
    'normal',
    24,
    70,
    null,
    '2026-03-16T06:30:00Z',
    'Food court entrance'
  ),
  (
    'bin-02',
    'esp32-bin-02',
    'Riverside Walk',
    'Dock 3 pedestrian strip',
    'East Bank',
    'full',
    78,
    70,
    '2026-03-16T12:05:00Z',
    '2026-03-15T19:20:00Z',
    'High weekend foot traffic'
  ),
  (
    'bin-03',
    'esp32-bin-03',
    'Campus North',
    'Engineering building exit',
    'University Zone',
    'collecting',
    71,
    70,
    '2026-03-16T11:42:00Z',
    '2026-03-16T11:55:00Z',
    'Night collection route'
  )
on conflict (id) do nothing;

insert into public.bin_events (
  bin_id,
  device_id,
  type,
  created_at,
  source,
  message
)
values
  (
    'bin-02',
    'esp32-bin-02',
    'bin_full',
    '2026-03-16T12:05:00Z',
    'rf-webhook',
    'RF threshold alert received from the assigned ESP32.'
  ),
  (
    'bin-03',
    'esp32-bin-03',
    'collected',
    '2026-03-16T11:55:00Z',
    'operator',
    'Collection team marked the bin as serviced.'
  );
