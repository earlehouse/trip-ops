do $$
declare
  v_trip_id uuid;
begin

select id into v_trip_id from trips where name = 'Delivery Leadership Offsite' limit 1;

insert into guests (trip_id, name, arrival_date, departure_date, hotel_confirmation, notes) values
  (v_trip_id, 'Max Reele',        null,         null,         null,       'Booking own hotel'),
  (v_trip_id, 'Jeff Wills',       null,         null,         null,       'Booking own hotel'),
  (v_trip_id, 'Ainsilie Hibbard', '2026-07-06', '2026-07-09', '82349183', null),
  (v_trip_id, 'Becca James',      null,         null,         null,       'Booking own hotel'),
  (v_trip_id, 'Purvi Desai',      null,         null,         null,       'Booking own hotel'),
  (v_trip_id, 'Kevan Mordan',     null,         null,         null,       'Booking own hotel'),
  (v_trip_id, 'Jennifer Van Hove',null,         null,         null,       'Booking own hotel');

end $$;
