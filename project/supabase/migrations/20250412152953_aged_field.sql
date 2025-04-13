/*
  # Fix assistant logs policies

  1. Changes
    - Safely add policies for assistant_logs if they don't exist
    - Use DO blocks to prevent errors if policies already exist

  2. Security
    - Policies allow authenticated users to:
      - Insert their own logs
      - Read their own logs
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

DO $$ 
BEGIN
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