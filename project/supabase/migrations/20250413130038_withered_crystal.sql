/*
  # Fix user_profiles table schema and update handling

  1. Changes
    - Add updated_at column if missing
    - Create trigger function for automatic updates
    - Add trigger to user_profiles table
    - Add proper indexes

  2. Security
    - No changes to existing RLS policies
*/

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and create it
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_profiles' 
    AND indexname = 'user_profiles_updated_at_idx'
  ) THEN
    CREATE INDEX user_profiles_updated_at_idx ON user_profiles(updated_at);
  END IF;
END $$;