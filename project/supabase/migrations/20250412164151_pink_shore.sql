/*
  # Fix assistant_logs table and policies

  1. Changes
    - Drop existing policies to avoid duplicates
    - Recreate table with correct structure
    - Add proper RLS policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Insert their own logs
      - Read their own logs
*/

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can insert their own logs" ON assistant_logs;
DROP POLICY IF EXISTS "Users can read their own logs" ON assistant_logs;

-- Recreate table with correct structure
CREATE TABLE IF NOT EXISTS assistant_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own logs"
  ON assistant_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own logs"
  ON assistant_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);