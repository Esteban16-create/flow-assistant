export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      moods: {
        Row: {
          id: string
          user_id: string
          mood: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood?: string
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          theme: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
      assistant_logs: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          context: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          context?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          context?: Json
          created_at?: string
        }
      }
    }
  }
}