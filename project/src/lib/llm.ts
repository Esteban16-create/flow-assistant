import type { Message } from './types';

export type Provider = 'openai' | 'claude' | 'mistral';

const SYSTEM_PROMPT = `Tu es Flow, un assistant intelligent spécialisé dans la gestion du temps et la productivité.

Pour les demandes de planification, réponds avec un tableau JSON au format :
{
  "type": "agenda",
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:mm"
    }
  ],
  "message": "string"
}

Pour les autres demandes, réponds normalement avec du texte.`;

export async function callLLM({
  provider = 'openai',
  messages,
  user,
}: {
  provider?: Provider;
  messages: Message[];
  user: string;
}): Promise<string> {
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];

  const apiKey = provider === 'openai' 
    ? import.meta.env.VITE_OPENAI_API_KEY
    : provider === 'claude'
    ? import.meta.env.VITE_CLAUDE_API_KEY
    : import.meta.env.VITE_MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${provider}. Please ensure the ${
      provider === 'openai' 
        ? 'VITE_OPENAI_API_KEY'
        : provider === 'claude'
        ? 'VITE_CLAUDE_API_KEY'
        : 'VITE_MISTRAL_API_KEY'
    } environment variable is set in your .env file.`);
  }

  const endpoint = provider === 'openai'
    ? 'https://api.openai.com/v1/chat/completions'
    : provider === 'claude'
    ? 'https://api.anthropic.com/v1/messages'
    : 'https://api.mistral.ai/v1/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (provider === 'claude') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = provider === 'claude'
    ? {
        model: 'claude-3-opus-20240229',
        messages,
        user,
        max_tokens: 1024,
      }
    : provider === 'mistral'
    ? {
        model: 'mistral-medium',
        messages,
        user,
      }
    : {
        model: 'gpt-4',
        messages,
        user,
      };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`${provider} API error: ${response.statusText}${
        errorData ? ` - ${JSON.stringify(errorData)}` : ''
      }`);
    }

    const data = await response.json();

    if (provider === 'claude') {
      return data?.content?.[0]?.text || `Erreur ${provider}`;
    }

    return data.choices?.[0]?.message?.content || `Erreur ${provider}`;
  } catch (error) {
    console.error(`Error calling ${provider} API:`, error);
    throw error;
  }
}