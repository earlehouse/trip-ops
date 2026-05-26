do $$
declare
  v_trip_id uuid;
begin

select id into v_trip_id from trips where name = 'Rise8 Leadership Offsite' limit 1;

insert into guests (trip_id, name, arrival_date, arrival_time, departure_date, departure_time, transport_mode, hotel_confirmation, bonvoy_number, notes) values

  (v_trip_id, 'Bryon Kroger',
    '2026-06-22', '21:25', '2026-06-25', '15:15',
    'flight', '97696493', '138800976', null),

  (v_trip_id, 'Carlo Viray',
    '2026-06-22', '16:10', '2026-06-24', '18:30',
    'flight', '97696507', '252091964', null),

  (v_trip_id, 'Kristin Pearson',
    '2026-06-22', '14:30', '2026-06-25', '12:00',
    'flight', '97696576', null, null),

  (v_trip_id, 'Jordan Dilworth',
    '2026-06-22', null, '2026-06-25', null,
    'driving', '97696615', null, 'Driving. Can pick up people at Boston airport on arrival. Heading to Boston to stay with friends after — can drive people to airport.'),

  (v_trip_id, 'Adam Furtado',
    '2026-06-22', null, '2026-06-25', null,
    'driving', null, null, 'No flights, no hotel'),

  (v_trip_id, 'Max Reele',
    '2026-06-22', null, '2026-06-25', null,
    'driving', '97696660', '216429121', null),

  (v_trip_id, 'Becca James',
    '2026-06-23', null, '2026-06-24', null,
    'driving', '97696681', null, 'Co-facilitator. Tuesday night only.'),

  (v_trip_id, 'Jeff Muller',
    '2026-06-22', null, '2026-06-25', '15:15',
    'amtrak', '97696696', null, 'Train from Boston to Providence Monday afternoon.'),

  (v_trip_id, 'Joe Andrews',
    '2026-06-22', '13:06', '2026-06-25', '15:16',
    'flight', '97696731', null, 'No flights back to TPA Tuesday night — needs Wednesday night hotel.'),

  (v_trip_id, 'Christal Walker',
    '2026-06-22', '13:06', '2026-06-25', '15:16',
    'flight', '97696768', null, null),

  (v_trip_id, 'Jeff Wills',
    '2026-06-22', '09:00', '2026-06-25', null,
    'driving', '97696782', '140104696', 'No flights. Confirm if Sunday night hotel needed.'),

  (v_trip_id, 'Rob Monroe',
    '2026-06-22', '16:55', '2026-06-25', '07:40',
    'flight', '97696825', '330779078', 'Facilitator'),

  (v_trip_id, 'Alexandra Brierton',
    '2026-06-22', null, '2026-06-25', null,
    'driving', null, null, 'No hotel needed.'),

  (v_trip_id, 'Liz Costello',
    '2026-06-22', '16:05', '2026-06-25', '07:06',
    'flight', '97696855', '537020715', 'EA. Arrives Boston 4:05pm, then to Providence.'),

  (v_trip_id, 'Jeff Thomas',
    '2026-06-22', '10:13', '2026-06-25', '10:43',
    'flight', '97696869', '081761363', null),

  (v_trip_id, 'Dan Montgomery',
    '2026-06-22', '14:30', '2026-06-25', '06:00',
    'flight', '97696882', '272722476', null);

end $$;
