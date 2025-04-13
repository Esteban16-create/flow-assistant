import { supabase } from './supabase';

export type UserPreferences = {
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'fr',
};

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, language')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading preferences:', error);
    throw error;
  }

  if (!data) {
    // Create default preferences if none exist
    const { error: insertError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        ...DEFAULT_PREFERENCES,
      });

    if (insertError) {
      console.error('Error creating default preferences:', insertError);
      throw insertError;
    }

    return DEFAULT_PREFERENCES;
  }

  return data as UserPreferences;
}

export async function saveUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
}