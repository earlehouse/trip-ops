-- 1. Rename bonvoy_number → marriott_loyalty for consistency with travelers table
alter table guests rename column bonvoy_number to marriott_loyalty;

-- 2. Add hilton_loyalty column to guests
alter table guests add column if not exists hilton_loyalty text;

-- 3. Seed travelers from all distinct guest names
insert into travelers (name)
select distinct trim(name)
from guests
where name is not null and trim(name) != ''
order by trim(name)
on conflict do nothing;

-- 4. Link every guest to their traveler record by case-insensitive name match
update guests g
set traveler_id = t.id
from travelers t
where lower(trim(g.name)) = lower(trim(t.name))
  and g.traveler_id is null;

-- 5. Copy existing bonvoy numbers up to travelers where we have data
update travelers t
set marriott_loyalty = (
  select marriott_loyalty
  from guests g
  where lower(trim(g.name)) = lower(trim(t.name))
    and g.marriott_loyalty is not null
    and trim(g.marriott_loyalty) != ''
  limit 1
)
where t.marriott_loyalty is null;

-- 6. Trigger function: when a guest's loyalty numbers change, propagate to their traveler
create or replace function sync_guest_loyalty_to_traveler()
returns trigger as $$
begin
  if new.traveler_id is not null then
    update travelers
    set
      marriott_loyalty = coalesce(new.marriott_loyalty, marriott_loyalty),
      hilton_loyalty   = coalesce(new.hilton_loyalty,   hilton_loyalty)
    where id = new.traveler_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- 7. Attach trigger (fires on insert or when loyalty fields / traveler_id change)
drop trigger if exists guest_loyalty_sync on guests;
create trigger guest_loyalty_sync
after insert or update of marriott_loyalty, hilton_loyalty, traveler_id
on guests
for each row
execute function sync_guest_loyalty_to_traveler();
