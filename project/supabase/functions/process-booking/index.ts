import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { OpenAI } from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface BookingRequest {
  type: 'restaurant' | 'flight' | 'hotel' | 'car';
  params: Record<string, string>;
  date?: string;
  time?: string;
  location?: string;
  guests?: number;
}

interface BookingResponse {
  success: boolean;
  bookingUrl?: string;
  eventDetails?: {
    title: string;
    start: string;
    end: string;
    location?: string;
  };
  message: string;
}

const BOOKING_URLS = {
  restaurant: 'https://www.thefork.fr/search?cityId=',
  flight: 'https://www.skyscanner.fr/transport/vols/',
  hotel: 'https://www.booking.com/searchresults.fr.html?ss=',
  car: 'https://www.rentalcars.com/SearchResults.do?location='
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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

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

    const { booking }: { booking: BookingRequest } = await req.json();

    if (!booking || !booking.type) {
      throw new Error('Invalid booking request');
    }

    // Generate booking URL
    const baseUrl = BOOKING_URLS[booking.type];
    const bookingUrl = baseUrl + encodeURIComponent(
      booking.location || booking.params.destination || ''
    );

    // Generate event details
    let eventDetails;
    if (booking.date && booking.time) {
      const start = new Date(`${booking.date}T${booking.time}`);
      const end = new Date(start.getTime() + (booking.type === 'restaurant' ? 120 : 60) * 60000);

      eventDetails = {
        title: `${
          booking.type === 'restaurant' ? '🍽️' :
          booking.type === 'flight' ? '✈️' :
          booking.type === 'hotel' ? '🏨' :
          '🚗'
        } ${booking.params.name || `Réservation ${booking.type}`}`,
        start: start.toISOString(),
        end: end.toISOString(),
        location: booking.location
      };

      // Create calendar event
      await supabase.from('events').insert({
        user_id: user.id,
        ...eventDetails
      });
    }

    // Log the booking request
    await supabase.from('assistant_logs').insert({
      user_id: user.id,
      message: `Booking request: ${booking.type}`,
      type: 'booking',
      context: {
        booking,
        bookingUrl,
        eventDetails
      }
    });

    const response: BookingResponse = {
      success: true,
      bookingUrl,
      eventDetails,
      message: `Votre réservation ${booking.type} a été initiée avec succès.`
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error processing booking:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process booking',
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