import { OpenAI } from "npm:openai@4.28.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ChatResponse {
  response: string;
  routine?: {
    title: string;
    activities: Array<{
      label: string;
      start: string;
      duration: number;
    }>;
    recurrence: string[];
  };
  bookingUrl?: string;
  eventDetails?: {
    title: string;
    start: string;
    end: string;
    location?: string;
    category?: 'pro' | 'perso' | 'hybride';
    color?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    const { message, context } = await req.json();

    if (!message || typeof message !== "string") {
      throw new Error("Message is required and must be a string");
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `
Tu es un expert en productivité et routines personnalisées. Ta mission est de créer des routines optimales basées sur les mots-clés fournis.

Règles importantes :
1. Adapte la routine aux thèmes demandés
2. Crée des enchaînements logiques et équilibrés
3. Respecte les contraintes de temps et d'énergie
4. Propose des durées réalistes

Exemples d'adaptations :
- "deep work" + "musique" → blocs de concentration avec ambiance musicale
- "finance" → sessions de revue budgétaire
- "sport" → séquence échauffement + exercice + récupération
- "méditation" → moments de pleine conscience
- "bien-être" → pauses et activités ressourçantes

Format de réponse JSON attendu :
{
  "response": "Message explicatif pour l'utilisateur",
  "routine": {
    "title": "Nom de la routine",
    "activities": [
      {
        "label": "Nom de l'activité",
        "start": "HH:mm",
        "duration": 30
      }
    ],
    "recurrence": ["lundi", "mercredi", "vendredi"]
  }
}

Message reçu : "${message}"
Contexte : ${JSON.stringify(context)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content!) as ChatResponse;

    // Log the routine generation
    if (response.routine && context?.user_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase.from("assistant_logs").insert({
        user_id: context.user_id,
        message: "Routine generated from keywords: " + message,
        type: "routine_generation",
        context: {
          message,
          routine: response.routine
        }
      });
    }

    return new Response(JSON.stringify(response), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error processing chat:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process chat message",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});