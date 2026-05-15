-- Seed: Providence — June 2026
-- Run after applying migrations

do $$
declare
  v_trip_id uuid;
  v_cfc_id uuid;
  v_growth_id uuid;
  v_cs_id uuid;
  v_facilitator_id uuid;

  -- event ids
  e_sun_happy uuid; e_sun_dinner uuid;
  e_mon_breakfast uuid; e_mon_starc uuid; e_mon_lunch uuid;
  e_mon_cfc_dinner uuid; e_mon_gc_dinner uuid; e_mon_gc_cowork uuid;
  e_tue_breakfast uuid; e_tue_osit uuid; e_tue_gc_workshop uuid;
  e_tue_lunch uuid; e_tue_cars uuid; e_tue_dinner uuid;
  e_wed_breakfast uuid; e_wed_depart uuid; e_wed_6sws uuid;
  e_wed_gc_workshop uuid; e_wed_lunch_6sws uuid; e_wed_lunch_gc uuid;
  e_wed_happy uuid; e_wed_dinner uuid;
  e_thu_breakfast uuid; e_thu_gc_workshop uuid; e_thu_lunch uuid; e_thu_cfc_depart uuid;
  e_fri_breakfast uuid; e_fri_gc_workshop uuid; e_fri_lunch uuid;
begin

-- ---- TRIP ----
insert into trips (name, office_location, start_date, end_date)
values ('Providence — June 2026', 'Providence, RI (Aloft Hotel)', '2026-06-08', '2026-06-13')
returning id into v_trip_id;

-- ---- TEAMS ----
insert into teams (trip_id, name, headcount, color) values (v_trip_id, 'CFC', 12, '#7F77DD') returning id into v_cfc_id;
insert into teams (trip_id, name, headcount, color) values (v_trip_id, 'Growth', 4, '#1D9E75') returning id into v_growth_id;
insert into teams (trip_id, name, headcount, color) values (v_trip_id, 'CS', 6, '#378ADD') returning id into v_cs_id;
insert into teams (trip_id, name, headcount, color) values (v_trip_id, 'Facilitator', 3, '#9ca3af') returning id into v_facilitator_id;

-- ---- GUESTS ----
-- CFC
insert into guests (trip_id, team_id, name, arrival_date, arrival_time, arrival_flight, departure_date, departure_time, departure_flight, transport_mode, special_requests) values
  (v_trip_id, v_cfc_id, 'Becca James',    '2026-06-08', '14:05', 'UA 6262',     '2026-06-11', '19:35', 'UA 4305',     'flight',   'VIP - King'),
  (v_trip_id, v_cfc_id, 'Yi Liu',          '2026-06-08', '23:55', 'PVD flight',  '2026-06-12', '14:45', 'PVD flight',  'flight',   null),
  (v_trip_id, v_cfc_id, 'Nate Enders',     '2026-06-08', '21:25', 'WN 3709',     '2026-06-12', '07:40', 'WN 3118',     'flight',   'Early check-in'),
  (v_trip_id, v_cfc_id, 'Anthony Zubia',   '2026-06-08', '07:40', 'SW 1813',     '2026-06-12', '07:40', 'SW 3118',     'flight',   'Early check-in'),
  (v_trip_id, v_cfc_id, 'Basudev Rijal',   '2026-06-08', '18:20', 'WN 267',      '2026-06-12', '15:15', 'WN 823',      'flight',   null),
  (v_trip_id, v_cfc_id, 'Evan Mladinov',   '2026-06-08', '21:20', 'Amtrak',      '2026-06-11', '15:00', 'Pickup needed','amtrak',  null),
  (v_trip_id, v_cfc_id, 'Mases Krikorian', '2026-06-08', '16:16', 'DL 4040',     '2026-06-12', '12:48', 'DL 3961',     'flight',   null),
  (v_trip_id, v_cfc_id, 'Cory Hurlbut',    '2026-06-08', '18:20', 'SW 1062',     '2026-06-12', '11:35', 'SW 4117',     'flight',   null),
  (v_trip_id, v_cfc_id, 'David Lamberson',  '2026-06-08', '23:36', 'MX 705',      '2026-06-12', '07:20', 'MX 704',      'flight',   null),
  (v_trip_id, v_cfc_id, 'Kyle Smart',       '2026-06-08', '05:10', 'SW AEPN6T',   '2026-06-12', '12:40', 'SW AEPN6T',   'flight',   'Early check-in'),
  (v_trip_id, v_cfc_id, 'Sagar Akre',       '2026-06-08', '10:12', 'UA 5813',     '2026-06-12', '12:00', 'UA 5250',     'flight',   'Early check-in'),
  (v_trip_id, v_cfc_id, 'Danny Benson',     '2026-06-08', '17:00', 'Driving',     '2026-06-12', null,    'Driving',     'driving',  null),
  (v_trip_id, v_cfc_id, 'Shawn Kilroy',     '2026-06-08', '16:20', 'DL 2314',     '2026-06-12', '13:00', 'DL 0971',     'flight',   null);

-- Growth
insert into guests (trip_id, team_id, name, arrival_date, arrival_time, arrival_flight, departure_date, departure_time, departure_flight, special_requests, bonvoy_number) values
  (v_trip_id, v_growth_id, 'Carlo Viray',    '2026-06-08', '16:16', null, '2026-06-12', '14:45', null, 'VIP - King', '252091964'),
  (v_trip_id, v_growth_id, 'Shanna Chen',    '2026-06-08', '20:11', null, '2026-06-12', '14:45', null, null, null),
  (v_trip_id, v_growth_id, 'Clayton Spakes', '2026-06-08', '13:43', null, '2026-06-12', '17:00', null, null, null),
  (v_trip_id, v_growth_id, 'Joshua Romero',  '2026-06-08', '18:20', null, '2026-06-12', '17:41', null, null, null);

-- CS
insert into guests (trip_id, team_id, name, arrival_date, arrival_time, departure_date, departure_time, special_requests) values
  (v_trip_id, v_cs_id, 'Kristin Pearson', '2026-06-08', '14:30', '2026-06-12', '11:00', 'VIP - King'),
  (v_trip_id, v_cs_id, 'Riya Patel',      '2026-06-08', '12:15', '2026-06-12', '08:30', null),
  (v_trip_id, v_cs_id, 'Terry Rydz',      '2026-06-08', '23:50', '2026-06-11', '10:30', null),
  (v_trip_id, v_cs_id, 'Sharon Hamilton', '2026-06-08', '20:20', '2026-06-12', '14:45', null),
  (v_trip_id, v_cs_id, 'Vicente Pamparo', '2026-06-08', '12:15', '2026-06-12', '08:30', null),
  (v_trip_id, v_cs_id, 'Debora Wence',    '2026-06-10', '16:16', '2026-06-12', '14:00', 'Arrives Wed');

-- Facilitators
insert into guests (trip_id, team_id, name, arrival_date, departure_date, bonvoy_number, special_requests) values
  (v_trip_id, v_facilitator_id, 'Rob Monroe',        '2026-06-08', '2026-06-12', '330779078', null),
  (v_trip_id, v_facilitator_id, 'Jason Fraser',      '2026-06-10', '2026-06-13', null, 'VIP - King'),
  (v_trip_id, v_facilitator_id, 'Guillermo Rivera',  '2026-06-08', '2026-06-11', null, 'VIP - King');

-- ---- EVENTS ----

-- Sunday Jun 8
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Welcome happy hour', '2026-06-08', '17:30', '19:00', true, 'needed') returning id into e_sun_happy;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Dinner', '2026-06-08', '19:30', '21:00', true, 'needed') returning id into e_sun_dinner;

-- Monday Jun 9
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Breakfast — on own', '2026-06-09', '08:00', '09:00', true, 'na') returning id into e_mon_breakfast;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'STARC OOD Workshop', '2026-06-09', '09:00', '17:00', false, 'booked') returning id into e_mon_starc;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Lunch', '2026-06-09', '12:00', '13:00', true, 'needed') returning id into e_mon_lunch;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'CFC team dinner', '2026-06-09', '17:45', '20:00', false, 'booked') returning id into e_mon_cfc_dinner;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Dinner', '2026-06-09', '19:00', '21:00', false, 'needed') returning id into e_mon_gc_dinner;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Growth & CS coworking', '2026-06-09', '09:00', '17:00', false, 'na') returning id into e_mon_gc_cowork;

-- Tuesday Jun 10
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Breakfast — on own', '2026-06-10', '08:00', '09:00', true, 'na') returning id into e_tue_breakfast;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'OSIT OOD Workshop', '2026-06-10', '09:00', '17:00', false, 'booked') returning id into e_tue_osit;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Growth & CS Workshop (Guillermo Rivera)', '2026-06-10', '09:00', '17:00', false, 'booked') returning id into e_tue_gc_workshop;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Lunch', '2026-06-10', '12:00', '13:00', true, 'needed') returning id into e_tue_lunch;
insert into events (trip_id, title, date, start_time, end_time, is_fuzzy_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Pick up rental cars', '2026-06-10', '12:00', null, true, false, 'needed') returning id into e_tue_cars;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Dinner', '2026-06-10', '19:00', '21:00', true, 'needed') returning id into e_tue_dinner;

-- Wednesday Jun 11
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Breakfast', '2026-06-11', '08:00', '09:00', true, 'needed') returning id into e_wed_breakfast;
insert into events (trip_id, title, date, start_time, end_time, is_fuzzy_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Depart for 6 SWS', '2026-06-11', '08:30', null, true, false, 'needed') returning id into e_wed_depart;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, '6 SWS visit + Facilitation Training', '2026-06-11', '09:00', '17:00', false, 'booked') returning id into e_wed_6sws;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Growth & CS Workshop day 2 (Guillermo Rivera)', '2026-06-11', '09:00', '17:00', false, 'booked') returning id into e_wed_gc_workshop;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Lunch — own adventure (6 SWS)', '2026-06-11', '12:00', '13:00', false, 'na') returning id into e_wed_lunch_6sws;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Lunch', '2026-06-11', '12:00', '13:00', false, 'needed') returning id into e_wed_lunch_gc;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Farewell happy hour', '2026-06-11', '17:30', '19:00', true, 'needed') returning id into e_wed_happy;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Dinner', '2026-06-11', '19:00', '21:00', true, 'needed') returning id into e_wed_dinner;

-- Thursday Jun 12
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Breakfast', '2026-06-12', '08:00', '09:00', false, 'needed') returning id into e_thu_breakfast;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Growth & CS Workshop (Jason Fraser, day 1)', '2026-06-12', '09:00', '17:00', false, 'booked') returning id into e_thu_gc_workshop;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Lunch', '2026-06-12', '12:00', '13:00', false, 'needed') returning id into e_thu_lunch;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Rolling CFC departures', '2026-06-12', '07:00', '15:00', false, 'na') returning id into e_thu_cfc_depart;

-- Friday Jun 13
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Breakfast', '2026-06-13', '08:00', '09:00', false, 'needed') returning id into e_fri_breakfast;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Growth & CS Workshop (Jason Fraser, day 2)', '2026-06-13', '09:00', '17:00', false, 'booked') returning id into e_fri_gc_workshop;
insert into events (trip_id, title, date, start_time, end_time, applies_to_all_teams, booking_status) values (v_trip_id, 'Lunch', '2026-06-13', '12:00', '13:00', false, 'needed') returning id into e_fri_lunch;

-- ---- EVENT_TEAMS ----

-- All-teams events (Sun)
insert into event_teams (event_id, team_id) values
  (e_sun_happy, v_cfc_id), (e_sun_happy, v_growth_id), (e_sun_happy, v_cs_id),
  (e_sun_dinner, v_cfc_id), (e_sun_dinner, v_growth_id), (e_sun_dinner, v_cs_id);

-- Mon
insert into event_teams (event_id, team_id) values
  (e_mon_breakfast, v_cfc_id), (e_mon_breakfast, v_growth_id), (e_mon_breakfast, v_cs_id),
  (e_mon_starc, v_cfc_id),
  (e_mon_lunch, v_cfc_id), (e_mon_lunch, v_growth_id), (e_mon_lunch, v_cs_id),
  (e_mon_cfc_dinner, v_cfc_id),
  (e_mon_gc_dinner, v_growth_id), (e_mon_gc_dinner, v_cs_id),
  (e_mon_gc_cowork, v_growth_id), (e_mon_gc_cowork, v_cs_id);

-- Tue
insert into event_teams (event_id, team_id) values
  (e_tue_breakfast, v_cfc_id), (e_tue_breakfast, v_growth_id), (e_tue_breakfast, v_cs_id),
  (e_tue_osit, v_cfc_id),
  (e_tue_gc_workshop, v_growth_id), (e_tue_gc_workshop, v_cs_id),
  (e_tue_lunch, v_cfc_id), (e_tue_lunch, v_growth_id), (e_tue_lunch, v_cs_id),
  (e_tue_cars, v_cfc_id),
  (e_tue_dinner, v_cfc_id), (e_tue_dinner, v_growth_id), (e_tue_dinner, v_cs_id);

-- Wed
insert into event_teams (event_id, team_id) values
  (e_wed_breakfast, v_cfc_id), (e_wed_breakfast, v_growth_id), (e_wed_breakfast, v_cs_id),
  (e_wed_depart, v_cfc_id),
  (e_wed_6sws, v_cfc_id),
  (e_wed_gc_workshop, v_growth_id), (e_wed_gc_workshop, v_cs_id),
  (e_wed_lunch_6sws, v_cfc_id),
  (e_wed_lunch_gc, v_growth_id), (e_wed_lunch_gc, v_cs_id),
  (e_wed_happy, v_cfc_id), (e_wed_happy, v_growth_id), (e_wed_happy, v_cs_id),
  (e_wed_dinner, v_cfc_id), (e_wed_dinner, v_growth_id), (e_wed_dinner, v_cs_id);

-- Thu
insert into event_teams (event_id, team_id) values
  (e_thu_breakfast, v_growth_id), (e_thu_breakfast, v_cs_id),
  (e_thu_gc_workshop, v_growth_id), (e_thu_gc_workshop, v_cs_id),
  (e_thu_lunch, v_growth_id), (e_thu_lunch, v_cs_id),
  (e_thu_cfc_depart, v_cfc_id);

-- Fri
insert into event_teams (event_id, team_id) values
  (e_fri_breakfast, v_growth_id), (e_fri_breakfast, v_cs_id),
  (e_fri_gc_workshop, v_growth_id), (e_fri_gc_workshop, v_cs_id),
  (e_fri_lunch, v_growth_id), (e_fri_lunch, v_cs_id);

end $$;
