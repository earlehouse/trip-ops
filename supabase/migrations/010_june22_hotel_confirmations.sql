-- Update hotel confirmation numbers for the June 22 Leadership Offsite
DO $$
DECLARE
  v_trip_id uuid;
BEGIN
  SELECT id INTO v_trip_id FROM trips WHERE start_date = '2026-06-22' LIMIT 1;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'June 22 trip not found';
  END IF;

  UPDATE guests SET hotel_confirmation = '97696493' WHERE trip_id = v_trip_id AND name ILIKE 'Bryon Kroger';
  UPDATE guests SET hotel_confirmation = '97696507' WHERE trip_id = v_trip_id AND name ILIKE 'Carlo Viray';
  UPDATE guests SET hotel_confirmation = '97696576' WHERE trip_id = v_trip_id AND name ILIKE 'Kristin Pearson';
  UPDATE guests SET hotel_confirmation = '97696615' WHERE trip_id = v_trip_id AND name ILIKE 'Jordan Dilworth';
  UPDATE guests SET hotel_confirmation = '97696660' WHERE trip_id = v_trip_id AND name ILIKE 'Max Reele';
  UPDATE guests SET hotel_confirmation = '97696681' WHERE trip_id = v_trip_id AND name ILIKE 'Becca James';
  UPDATE guests SET hotel_confirmation = '97696696' WHERE trip_id = v_trip_id AND name ILIKE 'Jeff Muller';
  UPDATE guests SET hotel_confirmation = '97696731' WHERE trip_id = v_trip_id AND name ILIKE 'Joe Andrews';
  UPDATE guests SET hotel_confirmation = '97696768' WHERE trip_id = v_trip_id AND name ILIKE 'Christal Walker';
  UPDATE guests SET hotel_confirmation = '97696782' WHERE trip_id = v_trip_id AND name ILIKE 'Jeff Wills';
  UPDATE guests SET hotel_confirmation = '97696825' WHERE trip_id = v_trip_id AND name ILIKE 'Rob Monroe';
  UPDATE guests SET hotel_confirmation = '97696855' WHERE trip_id = v_trip_id AND name ILIKE 'Liz Costello';
  UPDATE guests SET hotel_confirmation = '97696869' WHERE trip_id = v_trip_id AND name ILIKE 'Jeff Thomas';
  UPDATE guests SET hotel_confirmation = '97696882' WHERE trip_id = v_trip_id AND name ILIKE 'Dan Montgomery';

  -- Everyone else on this trip has no hotel
  UPDATE guests
  SET hotel_confirmation = 'No hotel'
  WHERE trip_id = v_trip_id
    AND (hotel_confirmation IS NULL OR hotel_confirmation = '');
END $$;
