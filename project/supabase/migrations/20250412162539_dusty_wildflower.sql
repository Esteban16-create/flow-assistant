/*
  # Add insert policy for assistant logs

  1. Changes
    - Add policy for users to insert their own logs
    - Use DO block to prevent errors if policy already exists

  2. Security
    - Policy allows authenticated users to insert logs where user_id matches their auth.uid()
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