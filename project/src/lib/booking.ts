import { supabase } from './supabase';

export interface BookingRequest {
  type: 'restaurant' | 'flight' | 'hotel' | 'car';
  params: Record<string, string>;
  date?: string;
  time?: string;
  location?: string;
  guests?: number;
}

export interface BookingResponse {
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

export async function processBooking(booking: BookingRequest): Promise<BookingResponse> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-booking`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ booking }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to process booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing booking:', error);
    throw error;
  }
}

export async function syncCalendar(event: {
  title: string;
  start: string;
  end: string;
  location?: string;
  category?: string;
  color?: string;
}): Promise<void> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-calendar`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to sync calendar');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing calendar:', error);
    throw error;
  }
}