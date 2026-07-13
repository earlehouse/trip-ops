-- Replace the wide-open "allow all" policies with a requirement for a logged-in
-- Supabase Auth session. Anyone with the anon key could previously read/write every
-- table directly via the Supabase REST API, bypassing this app's own login gate.
--
-- Two server routes intentionally have no user session (the ICS calendar feed and
-- the Slack webhook, which verifies requests via HMAC signature instead) — they now
-- use a service-role client that bypasses RLS entirely, so they're unaffected by this.

drop policy if exists "allow all" on trips;
create policy "authenticated only" on trips for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on teams;
create policy "authenticated only" on teams for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on guests;
create policy "authenticated only" on guests for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on events;
create policy "authenticated only" on events for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on event_teams;
create policy "authenticated only" on event_teams for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on bookings;
create policy "authenticated only" on bookings for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on travelers;
create policy "authenticated only" on travelers for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "allow all" on trip_groups;
create policy "authenticated only" on trip_groups for all using (auth.uid() is not null) with check (auth.uid() is not null);
