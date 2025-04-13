import type { Message } from "../llm";

export async function callOpenAI(messages: Message[], user: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      user,
    }),
  });

  if (!res.ok) {
    throw new Error("OpenAI API error");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Erreur OpenAI";
}