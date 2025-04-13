import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

    // Get recurring events
    const { data: recurring } = await supabase
      .from('recurring_events')
      .select('*')
      .eq('user_id', user.id);

    if (!recurring) {
      return Response.json({ message: 'Aucun événement récurrent' });
    }

    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Dimanche, 1 = Lundi...

    const generated = [];

    for (const item of recurring) {
      if (!item.jours?.[dayIndex === 0 ? 6 : dayIndex - 1]) continue; // aligner JS avec notre structure L à D

      const [h, m] = item.heure.split(':');
      const start = new Date(today);
      start.setHours(parseInt(h), parseInt(m), 0, 0);

      const end = new Date(start.getTime() + item.duree * 60000);

      await supabase.from('events').insert({
        user_id: user.id,
        title: `${item.categorie === 'pro' ? '🧠' : item.categorie === 'perso' ? '👨‍👩‍👧' : '🔀'} ${item.titre}`,
        start: start.toISOString(),
        end: end.toISOString(),
        category: item.categorie,
        color: item.couleur,
      });

      generated.push(item.titre);
    }

    return Response.json({ success: true, generated });
  } catch (error) {
    console.error('Error generating recurring events:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to generate recurring events',
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