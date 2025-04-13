import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Calendar, Loader2, TrendingUp } from 'lucide-react';

interface DayStats {
  date: string;
  total: number;
  focus: number;
  percent: number;
}

export default function FlowWeekStats() {
  const { user } = useAuth();
  const [days, setDays] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 6); // 6 jours avant
        startOfWeek.setHours(0, 0, 0, 0);

        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .gte('start', startOfWeek.toISOString());

        if (eventsError) throw eventsError;

        const dailyStats: Record<string, { total: number; focus: number }> = {};

        // Initialize stats for all days
        for (let i = 0; i < 7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().split('T')[0];
          dailyStats[key] = { total: 0, focus: 0 };
        }

        // Calculate stats for each event
        for (const ev of events || []) {
          const start = new Date(ev.start);
          const end = new Date(ev.end);
          const duration = (end.getTime() - start.getTime()) / 60000;
          const key = start.toISOString().split('T')[0];

          if (!dailyStats[key]) continue;

          dailyStats[key].total += duration;
          if (['pro', 'ia', 'routine', 'hybride'].includes(ev.category)) {
            dailyStats[key].focus += duration;
          }
        }

        // Convert to array and calculate percentages
        const result = Object.entries(dailyStats).map(([date, { total, focus }]) => ({
          date,
          total,
          focus,
          percent: total ? Math.round((focus / total) * 100) : 0,
        }));

        setDays(result);
      } catch (err: any) {
        console.error('Error fetching week stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to events changes
    const channel = supabase
      .channel('week-stats-changes')
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

  const getPercentageColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600 dark:text-green-400';
    if (percent >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Flow de la semaine
        </h2>
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-16">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(day.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                  })}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(day.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDuration(day.focus)} / {formatDuration(day.total)}
                </span>
              </div>
            </div>

            <div className={cn(
              "text-sm font-medium",
              getPercentageColor(day.percent)
            )}>
              {day.percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}