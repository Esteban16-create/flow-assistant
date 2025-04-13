import { OpenAI } from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Task {
  titre: string;
  micro_taches?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          details: "The OPENAI_API_KEY environment variable is missing or empty",
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

    const { task } = await req.json();

    if (!task || typeof task.titre !== "string") {
      throw new Error("Task title is required");
    }

    const openai = new OpenAI({
      apiKey,
    });

    const systemPrompt = `
Tu es un assistant autonome qui exécute des tâches simples pour l'utilisateur.
Voici une tâche : "${task.titre}"
${task.micro_taches?.length ? `Ses micro-tâches sont : ${task.micro_taches.join(", ")}` : ""}

Si tu peux rédiger, organiser, planifier ou donner une réponse utile à l'utilisateur, fais-le maintenant.
Réponds simplement comme si tu t'exécutais.

Format de réponse attendu :
{
  "result": "Ta réponse détaillée",
  "status": "completed | in_progress | needs_clarification",
  "next_steps": ["étape 1", "étape 2"] // optionnel
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }

    return new Response(response, {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error executing task:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to execute task",
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