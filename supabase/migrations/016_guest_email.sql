-- Add email column to guests and backfill from name using rise8.us format:
-- first initial + last name, lowercase, e.g. "Katherine Dey" → "kdey@rise8.us"

ALTER TABLE guests ADD COLUMN IF NOT EXISTS email text;

UPDATE guests
SET email = lower(
  left(
    split_part(trim(name), ' ', 1),  -- first name
    1
  )
  ||
  split_part(trim(name), ' ', -1)    -- last name (last word)
  ||
  '@rise8.us'
)
WHERE email IS NULL
  AND name IS NOT NULL
  AND name != ''
  AND name != 'New guest';
