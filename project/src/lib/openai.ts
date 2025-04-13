import OpenAI from 'openai';
import type { AgentContext } from './agent';

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error('OpenAI API key is not set. Please add VITE_OPENAI_API_KEY to your .env file.');
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const BASE_PROMPT = `Tu es Flow, un coach financier et personnel expert. Ta mission est d'aider l'utilisateur à atteindre son objectif de 10 000€ mensuels en 6 mois.

Principes clés :
1. Sois concis et direct
2. Propose des actions concrètes et réalisables
3. Adapte tes conseils à l'humeur de l'utilisateur
4. Encourage et motive, mais reste réaliste
5. Suis la progression et ajuste les recommandations

Pour chaque réponse :
- Analyse le contexte émotionnel
- Fournis des conseils pratiques
- Propose des étapes suivantes claires
- Garde l'objectif final en vue

Format de réponse : Structuré, clair, et actionnable.`;

export async function generateAIResponse(
  userMessage: string,
  context: AgentContext
): Promise<{ message: string; type: string }> {
  const { mood, focusTime = 0, streak = 0, userName } = context;
  
  const contextPrompt = `
Contexte actuel :
- Utilisateur : ${userName || 'Non spécifié'}
- Humeur : ${mood?.mood || 'Non spécifiée'}
- Focus aujourd'hui : ${focusTime}h
- Streak : ${streak} jours
- Objectif : 10 000€/mois en 6 mois
- Message : "${userMessage}"

Réponds de manière structurée et adaptée. Types de réponses possibles :
- greeting : Accueil et introduction
- motivation : Encouragement et inspiration
- celebration : Reconnaissance des progrès
- suggestion : Conseils pratiques et actions
- concern : Gestion des défis et obstacles

Format JSON attendu : { "message": "Ta réponse", "type": "Type choisi" }`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: BASE_PROMPT },
        { role: 'user', content: contextPrompt }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 250,
      response_format: { type: 'json_object' }
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const response = JSON.parse(completion.choices[0].message.content);
    
    if (!response.message || !response.type) {
      throw new Error('Invalid response format from OpenAI');
    }

    return {
      message: response.message,
      type: response.type
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      message: "Je suis désolé, j'ai rencontré une erreur. Réessayons plus tard !",
      type: 'concern'
    };
  }
}