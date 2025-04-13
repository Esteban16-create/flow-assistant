/*
  # Create retrospectives table for daily reviews

  1. New Tables
    - `retrospectives`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tasks_completed` (jsonb) - List of completed tasks
      - `focus_time` (integer) - Total focus time in minutes
      - `observations` (text) - AI-generated insights
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `retrospectives` table
    - Add policies for:
      - Users can insert their own retrospectives
      - Users can read their own retrospectives
*/

CREATE TABLE IF NOT EXISTS retrospectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tasks_completed jsonb NOT NULL DEFAULT '[]',
  focus_time integer NOT NULL DEFAULT 0,
  observations text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS retrospectives_user_id_idx ON retrospectives(user_id);
CREATE INDEX IF NOT EXISTS retrospectives_created_at_idx ON retrospectives(created_at);

-- Enable Row Level Security
ALTER TABLE retrospectives ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own retrospectives"
  ON retrospectives
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own retrospectives"
  ON retrospectives
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE retrospectives IS 'Stores daily user retrospectives with AI-generated insights';
COMMENT ON COLUMN retrospectives.tasks_completed IS 'JSON array of completed tasks with details';
COMMENT ON COLUMN retrospectives.focus_time IS 'Total focus time in minutes for the day';
COMMENT ON COLUMN retrospectives.observations IS 'AI-generated insights and observations';