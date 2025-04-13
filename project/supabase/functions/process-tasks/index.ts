import { OpenAI } from 'npm:openai@4.28.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Task {
  titre: string;
  micro_taches: string[];
  priorite: 'haute' | 'moyenne' | 'basse';
  duree: number;
  delegable: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string') {
      throw new Error('Input is required and must be a string');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const prompt = `
L'utilisateur t'écrit librement, tu extrais les tâches avec :
- titre
- micro-tâches
- priorité
- durée estimée (en minutes)
- déléguable (true/false)

Input : "${input}"

Retourne un JSON avec ce format :
{
  "tasks": [
    {
      "titre": "...",
      "micro_taches": ["...", "..."],
      "priorite": "haute | moyenne | basse",
      "duree": 30,
      "delegable": false
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    let jsonString = completion.choices[0].message.content;
    if (!jsonString) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse the response and extract tasks
    const parsedResponse = JSON.parse(jsonString);
    const tasks = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.tasks;

    if (!Array.isArray(tasks)) {
      throw new Error('Invalid tasks format in response');
    }

    // Save expression libre
    const { error: expressionError } = await supabase
      .from('expression_libre')
      .insert({
        user_id: user.id,
        contenu: input,
      });

    if (expressionError) {
      throw new Error(`Error saving expression: ${expressionError.message}`);
    }

    // Save tasks
    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(
        tasks.map(task => ({
          user_id: user.id,
          ...task
        }))
      );

    if (tasksError) {
      throw new Error(`Error saving tasks: ${tasksError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, tasks }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error processing tasks:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process tasks',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});