/*
  # Create routines table

  1. New Tables
    - `routines`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `nom` (text, not null)
      - `description` (text)
      - `etapes` (text[]) - Array of action steps
      - `active` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `routines` table
    - Add policies for:
      - Users can create their own routines
      - Users can read their own routines
      - Users can update their own routines
      - Users can delete their own routines

  3. Indexes
    - On user_id for faster lookups
    - On active status for filtering
*/

-- Create the routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL,
  description text,
  etapes text[] DEFAULT ARRAY[]::text[] NOT NULL,
  active boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS routines_user_id_idx ON routines(user_id);
CREATE INDEX IF NOT EXISTS routines_active_idx ON routines(active);

-- Enable Row Level Security
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own routines"
  ON routines
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own routines"
  ON routines
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines"
  ON routines
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines"
  ON routines
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE routines IS 'Stores user routines with their steps and activation status';
COMMENT ON COLUMN routines.nom IS 'Name of the routine';
COMMENT ON COLUMN routines.description IS 'Detailed description of the routine';
COMMENT ON COLUMN routines.etapes IS 'Array of steps/actions in the routine';
COMMENT ON COLUMN routines.active IS 'Whether the routine is currently active';