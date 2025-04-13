import type { Message } from "../llm";

export async function callClaude(messages: Message[], user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      messages,
      user,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    throw new Error("Claude API error");
  }

  const data = await res.json();
  return data?.content?.[0]?.text || "Erreur Claude";
}