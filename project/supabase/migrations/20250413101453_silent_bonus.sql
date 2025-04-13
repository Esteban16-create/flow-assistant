/*
  # Add progression tracking table

  1. New Tables
    - `progression`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `taches_terminees` (int, default 0)
      - `temps_gagne` (int, default 0)
      - `score_global` (int, default 0)
      - `last_updated` (timestamptz, default now())

  2. Security
    - Enable RLS on `progression` table
    - Add policies for authenticated users to:
      - Read their own progression
      - Update their own progression
      - Insert their own progression

  3. Indexes
    - On user_id for faster lookups
    - On last_updated for time-based queries
*/

-- Create the progression table
CREATE TABLE IF NOT EXISTS progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  taches_terminees int DEFAULT 0 NOT NULL,
  temps_gagne int DEFAULT 0 NOT NULL,
  score_global int DEFAULT 0 NOT NULL,
  last_updated timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS progression_user_id_idx ON progression(user_id);
CREATE INDEX IF NOT EXISTS progression_last_updated_idx ON progression(last_updated);

-- Enable Row Level Security
ALTER TABLE progression ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own progression"
  ON progression
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progression"
  ON progression
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progression"
  ON progression
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE progression IS 'Stores user progression metrics and statistics';
COMMENT ON COLUMN progression.taches_terminees IS 'Number of completed tasks';
COMMENT ON COLUMN progression.temps_gagne IS 'Time saved in minutes';
COMMENT ON COLUMN progression.score_global IS 'Overall user score';
COMMENT ON COLUMN progression.last_updated IS 'Last time progression was updated';