import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Activity {
  label: string;
  start: string;
  duration: number;
}

interface Routine {
  title: string;
  activities: Activity[];
  recurrence: string[];
}

// Map French weekdays to numbers (0 = Sunday, 1 = Monday, etc.)
const daysMap: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
};

function getNextDayOfWeek(weekday: string, time: string): Date {
  const targetDay = daysMap[weekday.toLowerCase()];
  const today = new Date();
  const result = new Date(today);
  result.setDate(today.getDate() + ((targetDay + 7 - today.getDay()) % 7));

  const [hour, minute] = time.split(':').map(Number);
  result.setHours(hour, minute, 0, 0);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { routine } = await req.json();

    if (!routine || !Array.isArray(routine.activities) || !Array.isArray(routine.recurrence)) {
      throw new Error('Invalid routine format');
    }

    const events = [];

    // Create events for each activity on each recurrence day
    for (const day of routine.recurrence) {
      for (const activity of routine.activities) {
        const start = getNextDayOfWeek(day, activity.start);
        const end = new Date(start.getTime() + activity.duration * 60000);

        events.push({
          user_id: user.id,
          title: `${routine.title} - ${activity.label}`,
          start: start.toISOString(),
          end: end.toISOString(),
          category: 'routine',
          color: '#7C3AED', // Primary color for routines
        });
      }
    }

    // Insert all events
    const { error: insertError } = await supabase
      .from('events')
      .insert(events);

    if (insertError) {
      throw insertError;
    }

    // Log the routine planning
    await supabase.from('assistant_logs').insert({
      user_id: user.id,
      message: `Routine planned: ${routine.title}`,
      type: 'routine_planning',
      context: {
        routine,
        events_created: events.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        events_created: events.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error planning routine:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to plan routine',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});