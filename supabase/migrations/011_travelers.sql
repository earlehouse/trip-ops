-- Persistent traveler profiles for loyalty numbers
create table if not exists travelers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  marriott_loyalty text,
  hilton_loyalty text,
  created_at timestamptz default now()
);

alter table travelers enable row level security;
create policy "allow all" on travelers for all using (true) with check (true);

-- Link guests to travelers (nullable)
alter table guests add column if not exists traveler_id uuid references travelers(id) on delete set null;
