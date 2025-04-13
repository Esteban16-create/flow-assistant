import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ListChecks, Loader2 } from 'lucide-react';

interface Routine {
  id: string;
  nom: string;
  description: string | null;
  etapes: string[];
  active: boolean;
  created_at: string;
}

export default function RoutineSteps() {
  const { user } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    const fetchActiveRoutine = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)
          .maybeSingle();

        if (fetchError) throw fetchError;
        setRoutine(data);
      } catch (err: any) {
        console.error('Error fetching active routine:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveRoutine();

    // Subscribe to changes
    const channel = supabase
      .channel('routine-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routines',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchActiveRoutine();
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
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-red-600 dark:text-red-400 text-center py-4">
          {error}
        </div>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-4">
          <ListChecks className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucune routine active
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Routine active
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {routine.nom}
          </h3>
          {routine.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {routine.description}
            </p>
          )}
        </div>

        {routine.etapes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Étapes à suivre :
            </h4>
            <div className="space-y-2">
              {routine.etapes.map((etape, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg",
                    "bg-gray-50 dark:bg-gray-800",
                    "border border-gray-200 dark:border-gray-700",
                    "flex items-center gap-3"
                  )}
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {etape}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}