-- Rugby Pitch Tracker schema
-- Run this in the Supabase SQL Editor to set up your database

-- Players in the squad
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  squad_number integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Matches
create table matches (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  opposition text not null,
  venue text not null,
  is_home boolean not null default true,
  location_lat double precision,
  location_lng double precision,
  weather_description text,
  weather_temp integer,
  weather_wind_speed integer,
  weather_icon text,
  status text not null default 'not_started',
  kick_off_at timestamptz,
  half_time_at timestamptz,
  second_half_start_at timestamptz,
  full_time_at timestamptz,
  selected_player_ids uuid[] not null default '{}',
  home_score integer not null default 0,
  away_score integer not null default 0,
  created_at timestamptz not null default now(),
  created_by text not null
);

-- Player on/off pitch events
create table pitch_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  type text not null check (type in ('on', 'off')),
  timestamp timestamptz not null default now(),
  recorded_by text not null
);

-- Score events (tries, conversions)
create table score_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  type text not null check (type in ('try', 'conversion')),
  scorer_id uuid references players(id) on delete set null,
  is_opposition boolean not null default false,
  timestamp timestamptz not null default now(),
  recorded_by text not null
);

-- Indexes for common queries
create index idx_pitch_events_match on pitch_events(match_id);
create index idx_pitch_events_player on pitch_events(player_id);
create index idx_score_events_match on score_events(match_id);
create index idx_matches_status on matches(status);

-- Enable realtime for all tables (multi-coach sync)
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table matches;
alter publication supabase_realtime add table pitch_events;
alter publication supabase_realtime add table score_events;

-- Row Level Security (permissive for now - all coaches can read/write)
alter table players enable row level security;
alter table matches enable row level security;
alter table pitch_events enable row level security;
alter table score_events enable row level security;

create policy "Allow all access to players" on players for all using (true) with check (true);
create policy "Allow all access to matches" on matches for all using (true) with check (true);
create policy "Allow all access to pitch_events" on pitch_events for all using (true) with check (true);
create policy "Allow all access to score_events" on score_events for all using (true) with check (true);
