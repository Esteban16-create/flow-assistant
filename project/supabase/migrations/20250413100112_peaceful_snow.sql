/*
  # Create Tasks Table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key) - Unique identifier for each task
      - `user_id` (uuid) - Reference to auth.users table
      - `titre` (text) - Task title
      - `micro_taches` (text[]) - Array of subtasks
      - `priorite` (text) - Task priority level
      - `duree` (int) - Estimated duration in minutes
      - `delegable` (boolean) - Whether the task can be delegated
      - `status` (text) - Task status with default 'non commencée'
      - `created_at` (timestamptz) - Timestamp of creation

  2. Security
    - Enable RLS on `tasks` table
    - Add policies for:
      - Users can create their own tasks
      - Users can read their own tasks
      - Users can update their own tasks
      - Users can delete their own tasks

  3. Constraints
    - Status validation using enum
    - Priority validation using enum
*/

-- Create enum types for status and priority
CREATE TYPE task_status AS ENUM ('non commencée', 'en cours', 'terminée', 'annulée');
CREATE TYPE task_priority AS ENUM ('haute', 'moyenne', 'basse');

-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titre text NOT NULL,
  micro_taches text[] DEFAULT ARRAY[]::text[] NOT NULL,
  priorite task_priority NOT NULL,
  duree int NOT NULL CHECK (duree > 0),
  delegable boolean DEFAULT false NOT NULL,
  status task_status DEFAULT 'non commencée' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE tasks IS 'Stores user tasks with priority, duration, and delegation information';
COMMENT ON COLUMN tasks.titre IS 'Task title';
COMMENT ON COLUMN tasks.micro_taches IS 'Array of subtasks associated with the main task';
COMMENT ON COLUMN tasks.priorite IS 'Task priority level (haute, moyenne, basse)';
COMMENT ON COLUMN tasks.duree IS 'Estimated task duration in minutes';
COMMENT ON COLUMN tasks.delegable IS 'Indicates if the task can be delegated';
COMMENT ON COLUMN tasks.status IS 'Current task status';