import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Calendar, Clock, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  titre: string;
  duree: number;
}

interface TaskSchedulerProps {
  task: Task;
  onScheduled?: () => void;
}

export default function TaskScheduler({ task, onScheduled }: TaskSchedulerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scheduleTask = async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    setError('');

    try {
      // Calculate time slot from current time
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (task.duree || 30) * 60000);

      const { error: scheduleError } = await supabase
        .from('events')
        .insert({
          title: task.titre,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
          user_id: user.id,
        });

      if (scheduleError) throw scheduleError;

      onScheduled?.();
    } catch (err: any) {
      console.error('Error scheduling task:', err);
      setError('Erreur lors de la planification de la tâche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={scheduleTask}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "bg-primary-100 hover:bg-primary-200 text-primary-700",
          "dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30",
          "py-2 px-4 rounded-lg font-medium",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Planification...
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5" />
            <span>Planifier ({task.duree} min)</span>
          </>
        )}
      </button>
    </div>
  );
}