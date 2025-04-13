/*
  # Create recurring events table

  1. New Tables
    - `recurring_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `titre` (text)
      - `heure` (time)
      - `duree` (integer)
      - `jours` (boolean[])
      - `categorie` (text)
      - `couleur` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can create their own recurring events
      - Users can read their own recurring events
      - Users can update their own recurring events
      - Users can delete their own recurring events
*/

CREATE TABLE IF NOT EXISTS recurring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titre text NOT NULL,
  heure time NOT NULL,
  duree integer NOT NULL CHECK (duree >= 15),
  jours boolean[] NOT NULL DEFAULT ARRAY[false, false, false, false, false, false, false],
  categorie text NOT NULL,
  couleur text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS recurring_events_user_id_idx ON recurring_events(user_id);

-- Enable Row Level Security
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own recurring events"
  ON recurring_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own recurring events"
  ON recurring_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring events"
  ON recurring_events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring events"
  ON recurring_events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE recurring_events IS 'Stores recurring events with their schedule and category information';
COMMENT ON COLUMN recurring_events.titre IS 'Event title';
COMMENT ON COLUMN recurring_events.heure IS 'Start time of the event';
COMMENT ON COLUMN recurring_events.duree IS 'Duration in minutes';
COMMENT ON COLUMN recurring_events.jours IS 'Array of 7 booleans representing days (Mon-Sun)';
COMMENT ON COLUMN recurring_events.categorie IS 'Event category (pro, perso, hybride)';
COMMENT ON COLUMN recurring_events.couleur IS 'Event color in hex format';