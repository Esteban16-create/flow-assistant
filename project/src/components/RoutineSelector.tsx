import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { CheckCircle2, Clock, ListChecks, Loader2 } from 'lucide-react';

interface Routine {
  id: string;
  nom: string;
  description: string | null;
  etapes: string[];
  active: boolean;
  created_at: string;
}

export default function RoutineSelector() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchRoutines = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('routines')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setRoutines(data || []);
        const activeRoutine = data?.find(r => r.active);
        if (activeRoutine) {
          setSelected(activeRoutine.id);
        }
      } catch (err: any) {
        console.error('Error fetching routines:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutines();
  }, [user]);

  const activateRoutine = async (id: string) => {
    if (!user?.id || activating) return;

    setActivating(true);
    setError('');

    try {
      // First, deactivate all routines for this user
      const { error: resetError } = await supabase
        .from('routines')
        .update({ active: false })
        .eq('user_id', user.id);

      if (resetError) throw resetError;

      // Then activate the selected routine
      const { error: activateError } = await supabase
        .from('routines')
        .update({ active: true })
        .eq('id', id);

      if (activateError) throw activateError;

      setSelected(id);
      setRoutines(prev => 
        prev.map(r => ({
          ...r,
          active: r.id === id
        }))
      );
    } catch (err: any) {
      console.error('Error activating routine:', err);
      setError('Erreur lors de l\'activation de la routine');
    } finally {
      setActivating(false);
    }
  };

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

  if (routines.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-4">
          <ListChecks className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucune routine disponible
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <ListChecks className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        Mes routines
      </h2>

      <div className="space-y-4">
        {routines.map((routine) => (
          <div
            key={routine.id}
            onClick={() => activateRoutine(routine.id)}
            className={cn(
              "p-4 rounded-lg border transition-all duration-200 cursor-pointer",
              "hover:border-primary-500 dark:hover:border-primary-400",
              routine.id === selected
                ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {routine.nom}
                </h3>
                {routine.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {routine.description}
                  </p>
                )}
                {routine.etapes.length > 0 && (
                  <ul className="space-y-1">
                    {routine.etapes.map((etape, index) => (
                      <li 
                        key={index}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                        {etape}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-2">
                {routine.active && (
                  <span className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Active
                  </span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(routine.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}