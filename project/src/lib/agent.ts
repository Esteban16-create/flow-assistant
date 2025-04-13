import { supabase } from './supabase';
import type { Database } from './database.types';

type Mood = Database['public']['Tables']['moods']['Row'];

export interface AgentContext {
  user_id: string;
  mood?: Mood;
  userName?: string;
}

export interface Routine {
  title: string;
  activities: Array<{
    label: string;
    start: string;
    duration: number;
  }>;
  recurrence: string[];
}

export async function getAgentContext(userId: string): Promise<AgentContext> {
  const context: AgentContext = {
    user_id: userId
  };

  // Get latest mood
  const { data: moodData } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (moodData) {
    context.mood = moodData;
  }

  // Get user profile data
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    context.userName = user.email.split('@')[0];
  }

  return context;
}

export async function processUserMessage(
  userId: string,
  message: string,
  context: AgentContext
): Promise<{
  response: string;
  routine?: Routine;
  bookingUrl?: string;
  eventDetails?: {
    title: string;
    start: string;
    end: string;
    location?: string;
  };
}> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-chat`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to process message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}