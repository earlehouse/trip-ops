-- Week-level containers that group multiple sub-trips together
create table if not exists trip_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamptz default now()
);

alter table trip_groups enable row level security;
create policy "allow all" on trip_groups for all using (true) with check (true);

-- Link trips to a group (nullable — standalone trips have no group)
alter table trips add column if not exists group_id uuid references trip_groups(id) on delete set null;

-- Mark events as shared across all sub-trips in a group
alter table events add column if not exists is_shared boolean not null default false;

-- Indexes
create index if not exists trips_group_id_idx on trips(group_id);
create index if not exists trip_groups_start_date_idx on trip_groups(start_date);
