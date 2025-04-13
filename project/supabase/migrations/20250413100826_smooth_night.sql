/*
  # Update OpenAI configuration

  1. Changes
    - Add comment to clarify OpenAI API key requirement
    - Ensure environment variable is properly named
  
  2. Security
    - No sensitive data is stored in the database
    - API key should be set in environment variables
*/

-- Add a comment to remind about the OpenAI API key requirement
COMMENT ON TABLE assistant_logs IS 'Requires VITE_OPENAI_API_KEY environment variable for AI functionality';