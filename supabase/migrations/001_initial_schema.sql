-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Trips
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  office_location text not null default '',
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  headcount int not null default 0,
  color text not null default '#94a3b8'
);

-- Guests
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  arrival_date date,
  arrival_time time,
  arrival_flight text,
  departure_date date,
  departure_time time,
  departure_flight text,
  transport_mode text,
  special_requests text,
  bonvoy_number text,
  notes text
);

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  date date not null,
  start_time time,
  end_time time,
  is_fuzzy_time bool not null default false,
  applies_to_all_teams bool not null default false,
  booking_status text not null default 'needed',
  venue text,
  headcount int,
  notes text,
  created_at timestamptz not null default now()
);

-- Event ↔ team join
create table if not exists event_teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  unique(event_id, team_id)
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  type text not null default 'other',
  status text not null default 'needed',
  vendor text,
  confirmation_number text,
  headcount int,
  notes text
);

-- Indexes for common queries
create index if not exists trips_start_date_idx on trips(start_date);
create index if not exists guests_trip_id_idx on guests(trip_id);
create index if not exists events_trip_id_date_idx on events(trip_id, date);
create index if not exists event_teams_event_id_idx on event_teams(event_id);
create index if not exists event_teams_team_id_idx on event_teams(team_id);

-- RLS (disable for single-admin app, re-enable if adding auth later)
alter table trips enable row level security;
alter table teams enable row level security;
alter table guests enable row level security;
alter table events enable row level security;
alter table event_teams enable row level security;
alter table bookings enable row level security;

-- Permissive policies (single admin user, no auth required for now)
create policy "allow all" on trips for all using (true) with check (true);
create policy "allow all" on teams for all using (true) with check (true);
create policy "allow all" on guests for all using (true) with check (true);
create policy "allow all" on events for all using (true) with check (true);
create policy "allow all" on event_teams for all using (true) with check (true);
create policy "allow all" on bookings for all using (true) with check (true);
