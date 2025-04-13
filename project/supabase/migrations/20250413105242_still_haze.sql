/*
  # Add vision field to user_profiles

  1. Changes
    - Add vision JSONB column to user_profiles table
    - Use DO block to prevent errors if column already exists
    - Add comment explaining the column's purpose

  2. Data Structure
    - vision: {
        who: string,
        where: string,
        why: string
      }
*/

DO $$ 
BEGIN
  -- Add vision column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'vision'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN vision jsonb DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN user_profiles.vision IS 'Stores user''s long-term vision data (who, where, why)';
  END IF;
END $$;