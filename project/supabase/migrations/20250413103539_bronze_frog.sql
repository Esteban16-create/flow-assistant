/*
  # Add XP column to user_profiles table

  1. Changes
    - Add XP column with default value of 0
    - Use DO block to safely add column if it doesn't exist

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new column
*/

DO $$ 
BEGIN
  -- Add XP column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'xp'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN xp int DEFAULT 0;
  END IF;
END $$;