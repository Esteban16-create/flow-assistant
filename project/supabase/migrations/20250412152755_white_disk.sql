/*
  # Add policy for assistant logs if missing

  1. Changes
    - Safely add policy for inserting logs if it doesn't exist
    - Use DO block to prevent errors if policy already exists

  2. Security
    - Policy allows authenticated users to insert their own logs
*/

DO $$ 
BEGIN
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
END $$;