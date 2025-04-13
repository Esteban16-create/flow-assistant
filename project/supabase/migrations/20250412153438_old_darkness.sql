/*
  # Update assistant logs RLS policies

  1. Changes
    - Enable RLS on assistant_logs table
    - Drop existing insert policy if it exists
    - Create new insert policy with proper checks
*/

-- Enable RLS
ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own logs" ON assistant_logs;

-- Create new insert policy
CREATE POLICY "Users can insert their own logs"
  ON assistant_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);