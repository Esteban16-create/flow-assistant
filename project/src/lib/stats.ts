import { supabase } from './supabase';

export interface UserStats {
  tasksCompleted: number;
  meetingsCount: number;
  focusTime: number;
  streak: number;
}

export async function calculateUserStats(userId: string): Promise<UserStats> {
  if (!userId) {
    return {
      tasksCompleted: 0,
      meetingsCount: 0,
      focusTime: 0,
      streak: 0
    };
  }

  try {
    // Get today's range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get completed tasks for today
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'terminée')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    // Get today's events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('start', today.toISOString())
      .lt('end', tomorrow.toISOString());

    // Calculate focus time from events
    let focusTime = 0;
    let meetingsCount = 0;

    events?.forEach(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

      if (['pro', 'ia', 'routine', 'hybride'].includes(event.category)) {
        focusTime += duration;
      }
      meetingsCount++;
    });

    // Calculate streak - using maybeSingle() to handle no data case
    const { data: streakData } = await supabase
      .from('progression')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      tasksCompleted: tasks?.length || 0,
      meetingsCount: meetingsCount,
      focusTime: Math.round(focusTime),
      streak: streakData?.streak || 0
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      tasksCompleted: 0,
      meetingsCount: 0,
      focusTime: 0,
      streak: 0
    };
  }
}