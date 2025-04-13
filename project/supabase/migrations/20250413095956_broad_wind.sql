/*
  # Create Expression Libre Table

  1. New Tables
    - `expression_libre`
      - `id` (uuid, primary key) - Unique identifier for each entry
      - `user_id` (uuid) - Reference to auth.users table
      - `contenu` (text) - The content of the free expression entry
      - `created_at` (timestamptz) - Timestamp of creation

  2. Security
    - Enable RLS on `expression_libre` table
    - Add policies for:
      - Users can insert their own entries
      - Users can read their own entries
      - Users can delete their own entries
      - Users cannot update entries (entries are immutable)

  3. Foreign Keys
    - `user_id` references auth.users(id) for data integrity
*/

-- Create the expression_libre table
CREATE TABLE IF NOT EXISTS expression_libre (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contenu text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS expression_libre_user_id_idx ON expression_libre(user_id);
CREATE INDEX IF NOT EXISTS expression_libre_created_at_idx ON expression_libre(created_at);

-- Enable Row Level Security
ALTER TABLE expression_libre ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own entries"
  ON expression_libre
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own entries"
  ON expression_libre
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON expression_libre
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE expression_libre IS 'Stores user free expression entries for mental clarity processing';
COMMENT ON COLUMN expression_libre.contenu IS 'The content of the free expression entry';