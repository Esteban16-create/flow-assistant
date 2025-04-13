import { OpenAI } from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GraphNode {
  id: string;
  type: 'task' | 'idea' | 'blocker';
  label: string;
  priority?: 'high' | 'medium' | 'low';
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
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

    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      throw new Error("Input is required and must be a string");
    }

    const openai = new OpenAI({
      apiKey,
    });

    const systemPrompt = `
Tu es un expert en analyse et structuration de pensées. Ton rôle est de transformer un texte libre en graphe de relations.

Pour chaque élément identifié, crée :
1. Un nœud avec :
   - id unique
   - type (task, idea, blocker)
   - label descriptif
   - priorité (high, medium, low) si pertinent

2. Des connexions entre les nœuds qui sont liés

Format de réponse JSON attendu :
{
  "nodes": [
    {
      "id": "string",
      "type": "task" | "idea" | "blocker",
      "label": "string",
      "priority": "high" | "medium" | "low"
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "node_id",
      "target": "node_id",
      "label": "string"
    }
  ]
}

Texte à analyser : "${input}"`;

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

    const graphData = JSON.parse(response) as GraphResponse;

    return new Response(JSON.stringify(graphData), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Error processing clarity graph:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process clarity graph",
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