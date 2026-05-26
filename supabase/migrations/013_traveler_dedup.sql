-- ── 1. Merge duplicate travelers ────────────────────────────────────────────
-- For each group of travelers that share the same normalized name,
-- pick the "winner" (most data filled in), re-point all guest traveler_ids
-- to the winner, then delete the losers.
do $$
declare
  winner_id   uuid;
  loser_id    uuid;
  norm_name   text;
begin
  for norm_name in
    select lower(trim(name))
    from travelers
    group by lower(trim(name))
    having count(*) > 1
  loop
    -- Winner: prefer the row with the most non-null loyalty fields, then oldest
    select id into winner_id
    from travelers
    where lower(trim(name)) = norm_name
    order by
      (case when marriott_loyalty is not null then 1 else 0 end +
       case when hilton_loyalty   is not null then 1 else 0 end) desc,
      created_at asc
    limit 1;

    -- Merge loyalty data from all losers into winner
    update travelers
    set
      marriott_loyalty = coalesce(
        (select marriott_loyalty from travelers where lower(trim(name)) = norm_name and marriott_loyalty is not null limit 1),
        marriott_loyalty
      ),
      hilton_loyalty = coalesce(
        (select hilton_loyalty from travelers where lower(trim(name)) = norm_name and hilton_loyalty is not null limit 1),
        hilton_loyalty
      )
    where id = winner_id;

    -- Re-point all guests that were linked to a loser
    update guests
    set traveler_id = winner_id
    where traveler_id in (
      select id from travelers
      where lower(trim(name)) = norm_name and id != winner_id
    );

    -- Delete the losers
    delete from travelers
    where lower(trim(name)) = norm_name and id != winner_id;
  end loop;
end $$;

-- ── 2. Unique constraint on normalized name ──────────────────────────────────
create unique index if not exists travelers_name_lower_idx
  on travelers (lower(trim(name)));

-- ── 3. Find-or-create trigger: auto-link new guests to existing traveler ─────
-- When a guest is inserted (or name updated) without a traveler_id,
-- find a matching traveler by name and link them; create one if none exists.
create or replace function auto_link_guest_to_traveler()
returns trigger as $$
declare
  v_traveler_id uuid;
begin
  -- Only run if traveler_id is not already set
  if new.traveler_id is null then
    -- Try to find existing traveler by normalized name
    select id into v_traveler_id
    from travelers
    where lower(trim(name)) = lower(trim(new.name))
    limit 1;

    if v_traveler_id is null then
      -- Create a new traveler record
      insert into travelers (name, marriott_loyalty, hilton_loyalty)
      values (trim(new.name), new.marriott_loyalty, new.hilton_loyalty)
      on conflict (lower(trim(name))) do update
        set
          marriott_loyalty = coalesce(travelers.marriott_loyalty, excluded.marriott_loyalty),
          hilton_loyalty   = coalesce(travelers.hilton_loyalty,   excluded.hilton_loyalty)
      returning id into v_traveler_id;
    end if;

    new.traveler_id := v_traveler_id;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists guest_auto_link_traveler on guests;
create trigger guest_auto_link_traveler
before insert or update of name
on guests
for each row
execute function auto_link_guest_to_traveler();
