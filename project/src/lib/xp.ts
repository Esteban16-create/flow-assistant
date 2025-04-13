import { supabase } from './supabase';

export async function gainXP(amount: number): Promise<{ success: boolean; xp: number }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-xp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      throw new Error('Failed to update XP');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating XP:', error);
    throw error;
  }
}