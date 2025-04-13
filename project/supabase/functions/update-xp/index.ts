import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get request body
    const { amount } = await req.json();

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Invalid XP amount');
    }

    // Get current XP
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('xp')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Error fetching user profile');
    }

    const currentXp = profile?.xp || 0;
    const newXp = currentXp + amount;

    // Update XP
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ xp: newXp })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Error updating XP');
    }

    return new Response(
      JSON.stringify({ success: true, xp: newXp }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Error updating XP:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update XP',
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