-- Split "Providence — June 2026" into a June 8 Week group with 3 sub-trips:
--   • CFC          (CFC team, CFC-specific events)
--   • Growth & CS  (Growth + CS teams, their shared workshops)
--   • Facilitators (Rob Monroe, Jason Fraser, Guillermo Rivera)
-- All-teams events (happy hours, shared dinners, shared lunches) become is_shared=true
-- and live on the CFC sub-trip so they appear in the group week view.

DO $$
DECLARE
  v_old_trip_id        uuid;
  v_group_id           uuid;
  v_cfc_trip_id        uuid;
  v_gc_trip_id         uuid;
  v_fac_trip_id        uuid;

  v_cfc_team_id        uuid;
  v_growth_team_id     uuid;
  v_cs_team_id         uuid;
  v_fac_team_id        uuid;
BEGIN

  -- ── Locate the original trip ─────────────────────────────────────────────
  SELECT id INTO v_old_trip_id
  FROM trips WHERE start_date = '2026-06-08' AND group_id IS NULL
  LIMIT 1;

  IF v_old_trip_id IS NULL THEN
    RAISE EXCEPTION 'June 8 trip not found (or already migrated)';
  END IF;

  -- ── Locate teams ─────────────────────────────────────────────────────────
  SELECT id INTO v_cfc_team_id    FROM teams WHERE trip_id = v_old_trip_id AND name = 'CFC';
  SELECT id INTO v_growth_team_id FROM teams WHERE trip_id = v_old_trip_id AND name = 'Growth';
  SELECT id INTO v_cs_team_id     FROM teams WHERE trip_id = v_old_trip_id AND name = 'CS';
  SELECT id INTO v_fac_team_id    FROM teams WHERE trip_id = v_old_trip_id AND name = 'Facilitator';

  -- ── Create the week group ─────────────────────────────────────────────────
  INSERT INTO trip_groups (name, start_date, end_date)
  VALUES ('June 8 Week', '2026-06-08', '2026-06-13')
  RETURNING id INTO v_group_id;

  -- ── Create sub-trips ──────────────────────────────────────────────────────
  INSERT INTO trips (name, office_location, start_date, end_date, group_id)
  VALUES ('CFC', 'Providence, RI (Aloft Hotel)', '2026-06-08', '2026-06-12', v_group_id)
  RETURNING id INTO v_cfc_trip_id;

  INSERT INTO trips (name, office_location, start_date, end_date, group_id)
  VALUES ('Growth & CS', 'Providence, RI (Aloft Hotel)', '2026-06-08', '2026-06-13', v_group_id)
  RETURNING id INTO v_gc_trip_id;

  INSERT INTO trips (name, office_location, start_date, end_date, group_id)
  VALUES ('Facilitators', 'Providence, RI (Aloft Hotel)', '2026-06-08', '2026-06-13', v_group_id)
  RETURNING id INTO v_fac_trip_id;

  -- ── Move teams to their sub-trips ─────────────────────────────────────────
  UPDATE teams SET trip_id = v_cfc_trip_id WHERE id = v_cfc_team_id;
  UPDATE teams SET trip_id = v_gc_trip_id  WHERE id IN (v_growth_team_id, v_cs_team_id);
  UPDATE teams SET trip_id = v_fac_trip_id WHERE id = v_fac_team_id;

  -- ── Move guests ───────────────────────────────────────────────────────────
  UPDATE guests SET trip_id = v_cfc_trip_id WHERE trip_id = v_old_trip_id AND team_id = v_cfc_team_id;
  UPDATE guests SET trip_id = v_gc_trip_id  WHERE trip_id = v_old_trip_id AND team_id IN (v_growth_team_id, v_cs_team_id);
  UPDATE guests SET trip_id = v_fac_trip_id WHERE trip_id = v_old_trip_id AND team_id = v_fac_team_id;
  -- Any guests without a team assignment default to CFC sub-trip
  UPDATE guests SET trip_id = v_cfc_trip_id WHERE trip_id = v_old_trip_id;

  -- ── Distribute events ─────────────────────────────────────────────────────
  -- 1. CFC-only events (event_teams has CFC but NOT Growth or CS)
  UPDATE events SET trip_id = v_cfc_trip_id
  WHERE trip_id = v_old_trip_id
    AND id IN (
      SELECT event_id FROM event_teams WHERE team_id = v_cfc_team_id
    )
    AND id NOT IN (
      SELECT event_id FROM event_teams WHERE team_id IN (v_growth_team_id, v_cs_team_id)
    );

  -- 2. Growth & CS events (event_teams has Growth or CS but NOT CFC)
  UPDATE events SET trip_id = v_gc_trip_id
  WHERE trip_id = v_old_trip_id
    AND id IN (
      SELECT event_id FROM event_teams WHERE team_id IN (v_growth_team_id, v_cs_team_id)
    )
    AND id NOT IN (
      SELECT event_id FROM event_teams WHERE team_id = v_cfc_team_id
    );

  -- 3. All-teams events (appear in both CFC and Growth/CS event_teams)
  --    → live on CFC sub-trip, flagged is_shared so they show in the group week view
  UPDATE events SET trip_id = v_cfc_trip_id, is_shared = true
  WHERE trip_id = v_old_trip_id
    AND id IN (
      SELECT event_id FROM event_teams WHERE team_id = v_cfc_team_id
      INTERSECT
      SELECT event_id FROM event_teams WHERE team_id IN (v_growth_team_id, v_cs_team_id)
    );

  -- 4. Any remaining events (no event_teams entries) → CFC sub-trip
  UPDATE events SET trip_id = v_cfc_trip_id WHERE trip_id = v_old_trip_id;

  -- ── Delete the original trip ──────────────────────────────────────────────
  -- (event_teams, guests, teams, events all cascade or were already moved)
  DELETE FROM trips WHERE id = v_old_trip_id;

END $$;
