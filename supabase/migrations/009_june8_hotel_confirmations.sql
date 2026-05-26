-- Update hotel confirmation numbers for the June 8 trip
DO $$
DECLARE
  v_trip_id uuid;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE start_date = '2026-06-08' LIMIT 1;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'June 8 trip not found';
  END IF;

  UPDATE guests SET hotel_confirmation = '85912156' WHERE trip_id = v_trip_id AND name ILIKE 'Becca James';
  UPDATE guests SET hotel_confirmation = '85912181' WHERE trip_id = v_trip_id AND name ILIKE 'Yi Liu';
  UPDATE guests SET hotel_confirmation = '85912208' WHERE trip_id = v_trip_id AND name ILIKE 'Nate Enders';
  UPDATE guests SET hotel_confirmation = '85912225' WHERE trip_id = v_trip_id AND name ILIKE 'Basudev Rijal';
  UPDATE guests SET hotel_confirmation = '85912239' WHERE trip_id = v_trip_id AND name ILIKE 'Evan Mladinov';
  UPDATE guests SET hotel_confirmation = '85912242' WHERE trip_id = v_trip_id AND name ILIKE 'Mases Krikorian';
  UPDATE guests SET hotel_confirmation = '85912260' WHERE trip_id = v_trip_id AND name ILIKE 'Cory Hurlbut';
  UPDATE guests SET hotel_confirmation = '85912275' WHERE trip_id = v_trip_id AND name ILIKE 'David Lamberson';
  UPDATE guests SET hotel_confirmation = '85912287' WHERE trip_id = v_trip_id AND name ILIKE 'Kyle Smart';
  UPDATE guests SET hotel_confirmation = '85912311' WHERE trip_id = v_trip_id AND name ILIKE 'Sagar Akre';
  UPDATE guests SET hotel_confirmation = '85912328' WHERE trip_id = v_trip_id AND name ILIKE 'Danny Benson';
  UPDATE guests SET hotel_confirmation = '85912336' WHERE trip_id = v_trip_id AND name ILIKE 'Shawn Kilroy';
  UPDATE guests SET hotel_confirmation = '85912372' WHERE trip_id = v_trip_id AND name ILIKE 'Carlo Viray';
  UPDATE guests SET hotel_confirmation = '85912381' WHERE trip_id = v_trip_id AND name ILIKE 'Shanna Chen';
  UPDATE guests SET hotel_confirmation = '85912387' WHERE trip_id = v_trip_id AND name ILIKE 'Clayton Spakes';
  UPDATE guests SET hotel_confirmation = '85912408' WHERE trip_id = v_trip_id AND name ILIKE 'Joshua Romero';
  UPDATE guests SET hotel_confirmation = '85912420' WHERE trip_id = v_trip_id AND name ILIKE 'Kristin Pearson';
  UPDATE guests SET hotel_confirmation = '85912461' WHERE trip_id = v_trip_id AND name ILIKE 'Riya Patel';
  UPDATE guests SET hotel_confirmation = '85912470' WHERE trip_id = v_trip_id AND name ILIKE 'Terry Rydz';
  UPDATE guests SET hotel_confirmation = '85912491' WHERE trip_id = v_trip_id AND name ILIKE 'Sharon Hamilton';
  UPDATE guests SET hotel_confirmation = '85912497' WHERE trip_id = v_trip_id AND name ILIKE 'Vicente Pamparo';
  UPDATE guests SET hotel_confirmation = '85912523' WHERE trip_id = v_trip_id AND name ILIKE 'Debora Wence';
  UPDATE guests SET hotel_confirmation = '85912525' WHERE trip_id = v_trip_id AND name ILIKE 'Jason Fraser';
  UPDATE guests SET hotel_confirmation = '85912539' WHERE trip_id = v_trip_id AND name ILIKE 'Guillermo Rivera';
  UPDATE guests SET hotel_confirmation = '85912572' WHERE trip_id = v_trip_id AND name ILIKE 'Rob Monroe';
  UPDATE guests SET hotel_confirmation = '85912221' WHERE trip_id = v_trip_id AND name ILIKE 'Max Reele';
  UPDATE guests SET hotel_confirmation = 'N/A'              WHERE trip_id = v_trip_id AND name ILIKE 'Adam Furtado';
  UPDATE guests SET hotel_confirmation = 'Own reservation'  WHERE trip_id = v_trip_id AND name ILIKE 'Bryon Kroger';
END $$;
