import { OpenAI } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ClarityResult {
  themes: Array<{
    title: string;
    items: string[];
  }>;
  actions: Array<{
    task: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  summary: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          details: 'The OPENAI_API_KEY environment variable is missing or empty',
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

    const { input } = await req.json();

    if (!input || typeof input !== 'string') {
      throw new Error('Input is required and must be a string');
    }

    const openai = new OpenAI({
      apiKey,
    });

    const prompt = `
Tu es un assistant de clarté mentale. L'utilisateur t'envoie un flot de pensées désordonné.
Analyse le texte et structure la réponse selon ce format :

1. Identifie les thèmes principaux et regroupe les éléments connexes
2. Propose des actions concrètes avec leur niveau de priorité
3. Fais une synthèse courte et encourageante

Input: "${input}"

Réponds en JSON strict avec ce format :
{
  "themes": [
    {
      "title": "Nom du thème",
      "items": ["élément 1", "élément 2"]
    }
  ],
  "actions": [
    {
      "task": "Action concrète à faire",
      "priority": "high | medium | low"
    }
  ],
  "summary": "Synthèse encourageante"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content!) as ClarityResult;

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error processing clarity request:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process mental clarity request',
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