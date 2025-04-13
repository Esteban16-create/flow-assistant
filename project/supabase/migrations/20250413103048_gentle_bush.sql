/*
  # Add micro_taches_status column to tasks table

  1. Changes
    - Add micro_taches_status boolean[] column to tasks table
    - Set default value to empty array
    - Make column not nullable
    - Add check constraint to ensure arrays have matching lengths

  2. Data Integrity
    - Use DO block for safe column addition
    - Add constraint to ensure micro_taches and micro_taches_status arrays have same length
*/

DO $$ 
BEGIN
  -- Add micro_taches_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'micro_taches_status'
  ) THEN
    ALTER TABLE tasks 
    ADD COLUMN micro_taches_status boolean[] DEFAULT ARRAY[]::boolean[] NOT NULL;

    -- Add constraint to ensure arrays have matching lengths
    ALTER TABLE tasks
    ADD CONSTRAINT micro_taches_length_match 
    CHECK (array_length(micro_taches, 1) = array_length(micro_taches_status, 1));
  END IF;
END $$;