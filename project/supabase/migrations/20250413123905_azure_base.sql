/*
  # Create daily suggestions table

  1. New Tables
    - `daily_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `titre` (text)
      - `categorie` (text) - e.g., "Ménage", "Enfants", "Sport"
      - `active` (boolean, default true)
      - `checked` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `daily_suggestions` table
    - Add policies for:
      - Users can create their own suggestions
      - Users can read their own suggestions
      - Users can update their own suggestions
      - Users can delete their own suggestions

  3. Indexes
    - On user_id for faster lookups
    - On categorie for filtering
    - On active status for quick active suggestions retrieval
*/

-- Create the daily_suggestions table
CREATE TABLE IF NOT EXISTS daily_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titre text NOT NULL,
  categorie text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  checked boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS daily_suggestions_user_id_idx ON daily_suggestions(user_id);
CREATE INDEX IF NOT EXISTS daily_suggestions_categorie_idx ON daily_suggestions(categorie);
CREATE INDEX IF NOT EXISTS daily_suggestions_active_idx ON daily_suggestions(active);

-- Enable Row Level Security
ALTER TABLE daily_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own suggestions"
  ON daily_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own suggestions"
  ON daily_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions"
  ON daily_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suggestions"
  ON daily_suggestions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE daily_suggestions IS 'Stores daily suggestions for users with categories and completion status';
COMMENT ON COLUMN daily_suggestions.titre IS 'The title/description of the suggestion';
COMMENT ON COLUMN daily_suggestions.categorie IS 'Category of the suggestion (e.g., "Ménage", "Enfants", "Sport")';
COMMENT ON COLUMN daily_suggestions.active IS 'Whether the suggestion is currently active';
COMMENT ON COLUMN daily_suggestions.checked IS 'Whether the suggestion has been completed';