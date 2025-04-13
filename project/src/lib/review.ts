import { supabase } from './supabase';

export async function generateDailyReview() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daily-review`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to generate daily review');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating daily review:', error);
    throw error;
  }
}

export async function getDailyReviews(userId: string, limit = 7) {
  try {
    const { data, error } = await supabase
      .from('retrospectives')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching daily reviews:', error);
    throw error;
  }
}