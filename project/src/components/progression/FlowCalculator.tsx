import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Clock, Brain, Target, Loader2, HelpCircle } from 'lucide-react';

export default function FlowCalculator() {
  const { user } = useAuth();
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isoStart = today.toISOString();
        const isoEnd = new Date(today.getTime() + 86400000).toISOString(); // +24h

        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .gte('start', isoStart)
          .lt('end', isoEnd);

        if (eventsError) throw eventsError;

        let total = 0;
        let focus = 0;

        for (const ev of events || []) {
          const start = new Date(ev.start);
          const end = new Date(ev.end);
          const duration = (end.getTime() - start.getTime()) / 60000;
          total += duration;

          if (['pro', 'ia', 'routine', 'hybride'].includes(ev.category)) {
            focus += duration;
          }
        }

        setTotalMinutes(total);
        setFocusMinutes(focus);
      } catch (err: any) {
        console.error('Error fetching events:', err);
        setError('Erreur lors du calcul des métriques');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to events changes
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pourcentage = totalMinutes === 0 ? 0 : Math.round((focusMinutes / totalMinutes) * 100);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-4">
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Calculatrice Flow
        </h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
          <Clock className="w-6 h-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}min
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Temps total structuré
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
          <Target className="w-6 h-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.floor(focusMinutes / 60)}h {focusMinutes % 60}min
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Temps focus
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
          <Brain className="w-6 h-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {pourcentage}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Optimisation journée
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div 
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {pourcentage >= 80 && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300">
                🔥 Exécution maximale. T'es en feu !
              </p>
            </div>
          )}
          {pourcentage < 80 && pourcentage >= 50 && (
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-yellow-700 dark:text-yellow-300">
                ⚡ T'es en flow, y'a moyen d'optimiser encore.
              </p>
            </div>
          )}
          {pourcentage < 50 && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <p className="text-blue-700 dark:text-blue-300">
                💡 Ajoute des blocs focus dans ton agenda pour optimiser ta journée
              </p>
              <HelpCircle 
                className="w-5 h-5 text-blue-500 dark:text-blue-400 cursor-help ml-2 flex-shrink-0"
              />
            </div>
          )}
          
          {showTooltip && pourcentage < 50 && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg w-64 text-sm z-10">
              <p>Tu peux améliorer ton flow en ajoutant des blocs focus dans l'agenda. Cela t'aidera à mieux structurer ta journée et à maximiser ta productivité.</p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-gray-800"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}