/*
  # Add assistant logs table

  1. New Tables
    - `assistant_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `message` (text)
      - `type` (text)
      - `context` (jsonb)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `assistant_logs` table
    - Add policies for:
      - Users can insert their own logs
      - Users can read their own logs
*/

CREATE TABLE IF NOT EXISTS assistant_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;

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