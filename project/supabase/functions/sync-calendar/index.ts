import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  location?: string;
  category?: string;
  color?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { event }: { event: CalendarEvent } = await req.json();

    if (!event || !event.title || !event.start || !event.end) {
      throw new Error('Invalid event data');
    }

    // Add event to calendar
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        category: event.category || 'perso',
        color: event.color || '#7C3AED'
      })
      .select()
      .single();

    if (error) throw error;

    // Log the calendar sync
    await supabase.from('assistant_logs').insert({
      user_id: user.id,
      message: 'Calendar event created',
      type: 'calendar_sync',
      context: { event: data }
    });

    return new Response(
      JSON.stringify({
        success: true,
        event: data
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error syncing calendar:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to sync calendar',
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