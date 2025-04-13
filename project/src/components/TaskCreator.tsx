import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Plus, Loader2 } from 'lucide-react';

interface TaskInput {
  titre: string;
  micro_taches: string[];
  priorite: 'haute' | 'moyenne' | 'basse';
  duree: number;
  delegable: boolean;
}

export default function TaskCreator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createTask = async (task: TaskInput) => {
    if (!user?.id || loading) return;

    setLoading(true);
    setError('');

    try {
      // Initialize status array with false values for each micro-task
      const micro_taches_status = task.micro_taches.map(() => false);

      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        titre: task.titre,
        micro_taches: task.micro_taches,
        micro_taches_status,
        priorite: task.priorite,
        duree: task.duree,
        delegable: task.delegable,
      });

      if (insertError) throw insertError;
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError('Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Task creation form would go here */}
      <button
        onClick={() => {
          // Example task for testing
          createTask({
            titre: "Test Task",
            micro_taches: ["Step 1", "Step 2"],
            priorite: "moyenne",
            duree: 30,
            delegable: false
          });
        }}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-primary-600 hover:bg-primary-700 text-white",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
        Créer une tâche
      </button>
    </div>
  );
}