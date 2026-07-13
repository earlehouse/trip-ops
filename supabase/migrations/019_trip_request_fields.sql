-- Fields carried by trip requests pushed in from the office-scheduler integration
alter table trips add column if not exists room_requested text;
alter table trips add column if not exists purpose text;
alter table trips add column if not exists estimated_attendees integer;
