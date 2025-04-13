import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Plus, Loader2 } from 'lucide-react';
import type { Task } from '../lib/types';

export default function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id: string, status: string) => {
    if (!user?.id) return;

    try {
      const newStatus = status === 'terminée' ? 'non commencée' : 'terminée';
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user?.id) return;

    try {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          titre: newTask.trim(),
          priorite: 'moyenne',
          duree: 30,
          status: 'non commencée'
        });

      if (insertError) throw insertError;
      setNewTask('');
      await fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTasks();

      // Subscribe to changes
      const channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Nouvelle tâche..."
          className={cn(
            "flex-1 px-3 py-2 rounded-lg border",
            "bg-gray-50 dark:bg-gray-800",
            "border-gray-300 dark:border-gray-600",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500 dark:placeholder-gray-400",
            "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          )}
        />
        <button
          onClick={addTask}
          disabled={!newTask.trim()}
          className={cn(
            "px-4 py-2 rounded-lg",
            "bg-primary-600 hover:bg-primary-700 text-white",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "p-3 rounded-lg",
              "bg-gray-50 dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700",
              "flex items-center gap-3"
            )}
          >
            <input
              type="checkbox"
              checked={task.status === 'terminée'}
              onChange={() => toggleTask(task.id, task.status)}
              className={cn(
                "rounded border-gray-300 text-primary-600",
                "focus:ring-primary-500",
                "dark:border-gray-600 dark:bg-gray-700"
              )}
            />
            <span
              className={cn(
                "flex-1",
                task.status === 'terminée' && "line-through text-gray-500 dark:text-gray-400"
              )}
            >
              {task.titre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}