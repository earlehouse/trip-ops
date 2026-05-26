do $$
declare
  v_enablement_id uuid;
  v_ddd1_id uuid;
  trip_ids uuid[];
  v_trip_id uuid;
begin

select id into v_enablement_id from trips where name = 'Enablement' limit 1;
select id into v_ddd1_id from trips where name = 'DDD 1 (Tracer, Mission OS Core)' limit 1;

trip_ids := array[v_enablement_id, v_ddd1_id];

foreach v_trip_id in array trip_ids loop

  insert into guests (trip_id, name, phone_number, arrival_date, arrival_time, departure_date, departure_time, transport_mode, notes) values

    (v_trip_id, 'Mike Gehard',
      null, '2026-06-29', '18:07', '2026-07-02', null,
      'flight', 'Arrives BOS 18:07 via YYJ→YUL→BOS. Staying in Boston Thursday night. Departs BOS→YYZ→YYJ Jul 3.'),

    (v_trip_id, 'Paul Nieto',
      '561-401-8257', '2026-06-29', '14:10', '2026-07-03', '15:05',
      'flight', null),

    (v_trip_id, 'Nick Mendiola',
      '(719) 203-8102', '2026-06-29', '16:10', '2026-07-03', '07:40',
      'flight', null),

    (v_trip_id, 'Dave Chapman',
      null, '2026-06-29', '14:35', '2026-07-03', '09:25',
      'flight', null),

    -- Placeholder rows — details TBD
    (v_trip_id, 'Schuyler Reinken',  null, null, null, null, null, null, 'Details pending'),
    (v_trip_id, 'Norman Sharpe',     null, null, null, null, null, null, 'Details pending'),
    (v_trip_id, 'Eric Whitman',      null, null, null, null, null, null, 'Details pending'),
    (v_trip_id, 'Michael Silverman', null, null, null, null, null, null, 'Details pending'),
    (v_trip_id, 'Lloyd Evans',       null, null, null, null, null, null, 'Details pending'),
    (v_trip_id, 'Steven Bair',       null, null, null, null, null, null, 'Details pending'),
    (v_trip_id, 'Andrew McFarland',  null, null, null, null, null, null, 'Details pending');

end loop;

end $$;
