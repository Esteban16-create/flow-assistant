import { Database } from './database.types';

export type Tables = Database['public']['Tables'];
export type Task = Tables['tasks']['Row'];
export type ExpressionLibre = Tables['expression_libre']['Row'];

export interface Message {
  role: string;
  content: string;
}

export interface Routine {
  title: string;
  activities: Array<{
    label: string;
    start: string;
    duration: number;
  }>;
  recurrence: string[];
}

export interface AssistantMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  messageType?: 'greeting' | 'motivation' | 'celebration' | 'suggestion' | 'concern';
  routine?: Routine;
  bookingUrl?: string;
  eventDetails?: {
    title: string;
    start: string;
    end: string;
    location?: string;
  };
}