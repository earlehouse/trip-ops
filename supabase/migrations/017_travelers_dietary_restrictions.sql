-- Column already exists in production (added directly via the Supabase dashboard);
-- this migration just brings the migrations folder back in sync with the live schema.
alter table travelers add column if not exists dietary_restrictions text;
