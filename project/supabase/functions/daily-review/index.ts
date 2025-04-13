import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { OpenAI } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface Task {
  id: string;
  titre: string;
  status: string;
  priorite: string;
  duree: number;
  created_at: string;
}

interface ExpressionLibre {
  id: string;
  contenu: string;
  created_at: string;
}

interface Progression {
  taches_terminees: number;
  temps_gagne: number;
  score_global: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Verify authentication
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

    // Get today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get completed tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'terminée')
      .gte('created_at', today.toISOString());

    // Get mental clarity entries
    const { data: entries } = await supabase
      .from('expression_libre')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    // Get progression
    const { data: progression } = await supabase
      .from('progression')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Generate AI summary
    const prompt = `
Analyse la journée de l'utilisateur et génère un résumé constructif.

Tâches terminées : ${JSON.stringify(tasks)}
Notes de clarté mentale : ${JSON.stringify(entries)}
Progression : ${JSON.stringify(progression)}

Format attendu :
{
  "summary": "Résumé des accomplissements et observations",
  "insights": ["Point clé 1", "Point clé 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content!);

    // Save retrospective
    const { error: saveError } = await supabase
      .from('retrospectives')
      .insert({
        user_id: user.id,
        tasks_completed: tasks || [],
        focus_time: tasks?.reduce((sum, t) => sum + (t.duree || 0), 0) || 0,
        observations: aiResponse.summary,
      });

    if (saveError) {
      throw saveError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tasks: tasks || [],
          entries: entries || [],
          progression: progression || {},
          ai_analysis: aiResponse,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error generating daily review:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate daily review',
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