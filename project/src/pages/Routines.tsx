import { useTranslation } from 'react-i18next';
import RoutineBuilder from '../components/RoutineBuilder';
import RoutineSelector from '../components/RoutineSelector';
import RoutineSteps from '../components/RoutineSteps';
import FocusMode from '../components/FocusMode';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Routine {
  id: string;
  nom: string;
  description: string | null;
  etapes: string[];
  active: boolean;
  created_at: string;
}

export default function Routines() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchActiveRoutine = async () => {
      const { data } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .maybeSingle();

      setActiveRoutine(data);
    };

    fetchActiveRoutine();

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🧘 Routines</h1>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-6">Créer une routine</h2>
            <RoutineBuilder />
          </div>
        </div>
        <div className="space-y-6">
          <RoutineSelector />
          <RoutineSteps />
        </div>
      </div>

      {activeRoutine && (
        <FocusMode routine={activeRoutine} />
      )}
    </div>
  );
}