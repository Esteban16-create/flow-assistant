import type { Message } from "../llm";

export async function callMistral(messages: Message[], user: string): Promise<string> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-medium",
      messages,
      user,
    }),
  });

  if (!res.ok) {
    throw new Error("Mistral API error");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Erreur Mistral";
}