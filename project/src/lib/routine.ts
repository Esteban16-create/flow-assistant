import { supabase } from './supabase';
import type { Routine } from './types';

export async function planRoutine(routine: Routine): Promise<{ success: boolean; events_created: number }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-routine`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routine }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to plan routine');
    }

    return await response.json();
  } catch (error) {
    console.error('Error planning routine:', error);
    throw error;
  }
}