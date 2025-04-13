import { useState } from 'react';
import { Bot, Loader2, Send, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Task {
  titre: string;
  micro_taches?: string[];
}

interface ExecutionResult {
  result: string;
  status: 'completed' | 'in_progress' | 'needs_clarification';
  next_steps?: string[];
}

export default function DelegationBot({ task }: { task: Task }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const executeTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-task`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute task');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Error executing task:', err);
      setError('Une erreur est survenue lors de l\'exécution de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!result) return null;

    switch (result.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />;
      case 'needs_clarification':
        return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Assistant de délégation
        </h2>
      </div>

      <div className="space-y-4">
        {/* Task Details */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            {task.titre}
          </h3>
          {task.micro_taches && task.micro_taches.length > 0 && (
            <ul className="space-y-1">
              {task.micro_taches.map((tache, index) => (
                <li 
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  {tache}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Execution Result */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              {getStatusIcon()}
              <span className="text-gray-900 dark:text-white">
                {result.status === 'completed' && 'Tâche terminée'}
                {result.status === 'in_progress' && 'En cours d\'exécution'}
                {result.status === 'needs_clarification' && 'Clarification nécessaire'}
              </span>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {result.result}
              </p>
            </div>

            {result.next_steps && result.next_steps.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Prochaines étapes :
                </h4>
                <ul className="space-y-2">
                  {result.next_steps.map((step, index) => (
                    <li 
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <ArrowRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={executeTask}
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "bg-primary-600 hover:bg-primary-700 text-white",
            "py-2 px-4 rounded-lg font-medium",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Exécution en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Exécuter la tâche
            </>
          )}
        </button>
      </div>
    </div>
  );
}