import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateDailyReview } from '../lib/review';
import { cn } from '../lib/utils';
import { CheckCircle2, Clock, Brain, Loader2, BarChart2 } from 'lucide-react';

interface Review {
  tasks: Array<{
    titre: string;
    duree: number;
    priorite: string;
  }>;
  entries: Array<{
    contenu: string;
  }>;
  progression: {
    taches_terminees: number;
    temps_gagne: number;
  };
  ai_analysis: {
    summary: string;
    insights: string[];
    suggestions: string[];
  };
}

export default function DailyReview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState<Review | null>(null);

  const handleGenerateReview = async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    setError('');

    try {
      const data = await generateDailyReview();
      setReview(data.data);
    } catch (err: any) {
      console.error('Error generating review:', err);
      setError('Erreur lors de la génération de la rétro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Rétro du jour
          </h2>
        </div>

        <button
          onClick={handleGenerateReview}
          disabled={loading}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
            "bg-primary-600 hover:bg-primary-700 text-white",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <BarChart2 className="w-5 h-5" />
              Générer la rétro
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {review && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {review.progression.taches_terminees}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tâches terminées
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(review.progression.temps_gagne / 60)}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Temps focus
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20">
              <h3 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                Résumé
              </h3>
              <p className="text-primary-800 dark:text-primary-200">
                {review.ai_analysis.summary}
              </p>
            </div>

            {review.ai_analysis.insights.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Points clés
                </h3>
                <ul className="space-y-2">
                  {review.ai_analysis.insights.map((insight, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.ai_analysis.suggestions.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Suggestions
                </h3>
                <ul className="space-y-2">
                  {review.ai_analysis.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}