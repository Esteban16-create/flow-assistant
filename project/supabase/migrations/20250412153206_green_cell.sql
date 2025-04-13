/*
  # Fix assistant logs RLS setup

  1. Changes
    - Enable RLS on assistant_logs table if not already enabled
    - Safely create policies if they don't exist
    - Use DO blocks to prevent duplicate policy errors

  2. Security
    - Ensure RLS is enabled
    - Add policies for authenticated users to:
      - Insert their own logs
      - Read their own logs
*/

-- First ensure RLS is enabled
ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;

-- Safely create policies using DO blocks
DO $$ 
BEGIN
  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assistant_logs' 
    AND policyname = 'Users can insert their own logs'
  ) THEN
    CREATE POLICY "Users can insert their own logs"
      ON assistant_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assistant_logs' 
    AND policyname = 'Users can read their own logs'
  ) THEN
    CREATE POLICY "Users can read their own logs"
      ON assistant_logs
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;