import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Brain, Sparkles, Loader2 } from 'lucide-react';

export default function XPCard() {
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    const fetchXP = async () => {
      try {
        // First try to get the existing profile
        let { data, error } = await supabase
          .from('user_profiles')
          .select('xp')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        // If no profile exists, create one with default XP
        if (!data) {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([
              {
                id: user.id,
                xp: 0
              }
            ])
            .select('xp')
            .single();

          if (createError) throw createError;
          data = newProfile;
        }

        setXp(data?.xp || 0);
        setError('');
      } catch (err: any) {
        console.error('Error fetching XP:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchXP();

    // Subscribe to XP changes
    const channel = supabase
      .channel('xp-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchXP();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-red-600 dark:text-red-400 text-sm text-center">
          Erreur lors du chargement de l'XP
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          XP Mental
        </h2>
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
          <span className="text-3xl font-mono font-bold text-primary-600 dark:text-primary-400">
            {xp}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          +10 par tâche complétée
        </p>
      </div>
    </div>
  );
}