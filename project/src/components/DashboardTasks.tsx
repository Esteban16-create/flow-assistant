import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { CheckCircle2, Clock, AlertCircle, Users, Loader2 } from 'lucide-react';
import { gainXP } from '../lib/xp';
import XPGain from './XPGain';
import { calculateUserStats } from '../lib/stats';

interface Task {
  id: string;
  titre: string;
  status: 'non commencée' | 'en cours' | 'terminée' | 'annulée';
  priorite: 'haute' | 'moyenne' | 'basse';
  duree: number;
  delegable: boolean;
  micro_taches: string[];
  micro_taches_status: boolean[];
  created_at: string;
}

export default function DashboardTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .not('status', 'eq', 'terminée')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const validateTask = async (id: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'terminée' })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh tasks
      await fetchTasks();
      
      // Award XP
      await gainXP(10);
      
      // Recalculate stats
      await calculateUserStats(user.id);
    } catch (err) {
      console.error('Error validating task:', err);
    }
  };

  const delegateTask = async (task: Task) => {
    if (!task.delegable) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'en cours' })
        .eq('id', task.id);

      if (error) throw error;
      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, status: 'en cours' } : t
      ));
    } catch (err) {
      console.error('Error delegating task:', err);
    }
  };

  const toggleMicroTask = async (taskId: string, index: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const newStatus = [...(task.micro_taches_status || [])];
      newStatus[index] = !newStatus[index];

      const { error } = await supabase
        .from('tasks')
        .update({ micro_taches_status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, micro_taches_status: newStatus }
          : t
      ));

      // Award XP for completing micro-task
      if (newStatus[index]) {
        await gainXP(2);
      }
    } catch (err) {
      console.error('Error updating micro-task status:', err);
    }
  };

  const getPriorityColor = (priority: Task['priorite']) => {
    switch (priority) {
      case 'haute':
        return 'text-red-600 dark:text-red-400';
      case 'moyenne':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'basse':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 
      ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
      : `${mins}min`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-red-600 dark:text-red-400 text-sm">
          Une erreur est survenue lors du chargement des tâches.
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-4">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Aucune tâche en cours
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        Tâches en cours
      </h3>
      
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "p-4 rounded-lg",
              "bg-gray-50 dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  {task.titre}
                </h4>
                
                {task.micro_taches?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {task.micro_taches.map((tache, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={task.micro_taches_status?.[index] || false}
                            onChange={() => toggleMicroTask(task.id, index)}
                            className={cn(
                              "rounded border-gray-300 text-primary-600",
                              "focus:ring-primary-500 focus:border-primary-500",
                              "dark:border-gray-600 dark:bg-gray-700",
                              "dark:checked:bg-primary-600 dark:checked:border-primary-600",
                              "transition-colors duration-200"
                            )}
                          />
                          <span className={cn(
                            task.micro_taches_status?.[index] && "line-through text-gray-400 dark:text-gray-500"
                          )}>
                            {tache}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className={cn(
                    "font-medium",
                    getPriorityColor(task.priorite)
                  )}>
                    {task.priorite}
                  </span>

                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    {formatDuration(task.duree)}
                  </span>

                  {task.delegable && (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      Délégable
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {task.delegable && task.status === 'non commencée' && (
                  <button
                    onClick={() => delegateTask(task)}
                    className={cn(
                      "p-2 rounded-lg",
                      "hover:bg-gray-200 dark:hover:bg-gray-700",
                      "text-gray-600 dark:text-gray-400",
                      "transition-colors duration-200"
                    )}
                  >
                    <Users className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => validateTask(task.id)}
                  className={cn(
                    "p-2 rounded-lg",
                    "hover:bg-gray-200 dark:hover:bg-gray-700",
                    "text-gray-600 dark:text-gray-400",
                    "transition-colors duration-200"
                  )}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}