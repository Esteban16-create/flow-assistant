import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Sparkles, Target, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { ClarityResult } from '../lib/types';

export default function MentalClarity() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ClarityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProcess = async () => {
    if (!input.trim() || !user?.id || loading) return;

    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-clarity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check for specific API key error
        if (data.details?.includes('OPENAI_API_KEY')) {
          throw new Error('Le service est temporairement indisponible. Veuillez contacter l\'administrateur du système.');
        }
        throw new Error(data.error || 'Failed to process clarity request');
      }

      setResult(data);

      // Log the clarity session
      await supabase.from('assistant_logs').insert({
        user_id: user.id,
        message: input,
        type: 'mental_clarity',
        context: {
          input,
          result: data,
        },
      });
    } catch (error: any) {
      console.error('Error processing clarity:', error);
      setError(error.message || 'Une erreur est survenue lors du traitement');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <h1 className="text-2xl font-bold">{t('nav.mentalClarity')}</h1>
      </div>

      {/* Introduction */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Objectif
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Exprime librement tes pensées, préoccupations ou idées. L'IA t'aidera à organiser tout ça 
            et à identifier les actions concrètes à entreprendre.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Expression libre
          </h2>
          
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <textarea
            placeholder="Balance ici tes pensées, blocages, idées en vrac..."
            className={cn(
              "w-full p-4 rounded-lg border min-h-[200px] resize-none",
              "bg-gray-50 dark:bg-gray-800",
              "border-gray-300 dark:border-gray-600",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "transition-colors duration-200"
            )}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="flex justify-end">
            <button
              onClick={handleProcess}
              disabled={loading || !input.trim()}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-lg font-medium",
                "bg-primary-600 hover:bg-primary-700 text-white",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyser
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-3">💡 Synthèse</h3>
              <p className="text-gray-600 dark:text-gray-400">{result.summary}</p>
            </div>

            {/* Themes */}
            <div>
              <h3 className="text-lg font-semibold mb-3">🎯 Thèmes identifiés</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {result.themes.map((theme, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="font-medium mb-2">{theme.title}</h4>
                    <ul className="space-y-1">
                      {theme.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">✅ Actions suggérées</h3>
              <div className="space-y-2">
                {result.actions.map((action, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                  >
                    <span>{action.task}</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getPriorityColor(action.priority)
                    )}>
                      {action.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}