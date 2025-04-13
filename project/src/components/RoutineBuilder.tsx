import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Send, Loader2, ListChecks } from 'lucide-react';

const KEYWORDS = [
  { id: 'bien-etre', label: '🧘 Bien-être', category: 'lifestyle' },
  { id: 'finance', label: '💰 Finance', category: 'work' },
  { id: 'reseaux', label: '🌐 Réseaux', category: 'work' },
  { id: 'sport', label: '🏃‍♂️ Sport', category: 'health' },
  { id: 'detente', label: '🌿 Détente', category: 'lifestyle' },
  { id: 'meditation', label: '🧠 Méditation', category: 'health' },
  { id: 'musique', label: '🎵 Musique', category: 'hobby' },
  { id: 'deep-work', label: '💻 Deep Work', category: 'work' },
  { id: 'creativite', label: '🎨 Créativité', category: 'hobby' },
  { id: 'freelance', label: '🚀 Freelance', category: 'work' }
];

interface Routine {
  title: string;
  activities: Array<{
    label: string;
    start: string;
    duration: number;
  }>;
  recurrence: string[];
}

export default function RoutineBuilder() {
  const { user } = useAuth();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [error, setError] = useState('');

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const generateRoutine = async () => {
    if (!user?.id || loading) return;
    if (selectedKeywords.length === 0 && !customInput.trim()) {
      setError('Sélectionnez des mots-clés ou ajoutez une description');
      return;
    }

    setLoading(true);
    setError('');
    setRoutine(null);

    try {
      const message = selectedKeywords.length > 0
        ? `Crée-moi une routine autour de : ${selectedKeywords.map(k => 
            KEYWORDS.find(kw => kw.id === k)?.label.split(' ')[1]
          ).join(', ')}${customInput ? `. ${customInput}` : ''}`
        : customInput;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            context: {
              user_id: user.id,
              keywords: selectedKeywords,
              customInput
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate routine');
      }

      const data = await response.json();
      if (data.routine) {
        setRoutine(data.routine);
      } else {
        throw new Error('No routine generated');
      }
    } catch (err: any) {
      console.error('Error generating routine:', err);
      setError(err.message || 'Erreur lors de la génération de la routine');
    } finally {
      setLoading(false);
    }
  };

  const saveRoutine = async () => {
    if (!routine || !user?.id) return;

    try {
      // Convert activities to steps array
      const steps = routine.activities.map(
        activity => `${activity.label} (${activity.start}, ${activity.duration}min)`
      );

      // Convert recurrence days to boolean array
      const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      const jours = daysOfWeek.map(day => routine.recurrence.includes(day));

      const { error: saveError } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          nom: routine.title,
          etapes: steps,
          jours,
          created_at: new Date().toISOString()
        });

      if (saveError) throw saveError;

      // Reset form
      setSelectedKeywords([]);
      setCustomInput('');
      setRoutine(null);
    } catch (err) {
      console.error('Error saving routine:', err);
      setError('Erreur lors de la sauvegarde de la routine');
    }
  };

  return (
    <div className="space-y-6">
      {/* Keywords Selection */}
      <div>
        <h3 className="text-lg font-medium mb-3">Mots-clés</h3>
        <div className="flex flex-wrap gap-2">
          {KEYWORDS.map((keyword) => (
            <button
              key={keyword.id}
              onClick={() => toggleKeyword(keyword.id)}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors duration-200",
                selectedKeywords.includes(keyword.id)
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              {keyword.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div>
        <h3 className="text-lg font-medium mb-3">Description personnalisée (optionnel)</h3>
        <textarea
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Ajoutez des détails spécifiques pour votre routine..."
          className={cn(
            "w-full px-4 py-3 rounded-lg border resize-none",
            "bg-gray-50 dark:bg-gray-800",
            "border-gray-300 dark:border-gray-600",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500 dark:placeholder-gray-400",
            "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          )}
          rows={3}
        />
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateRoutine}
        disabled={loading || (selectedKeywords.length === 0 && !customInput.trim())}
        className={cn(
          "w-full flex items-center justify-center gap-2",
          "bg-primary-600 hover:bg-primary-700 text-white",
          "py-3 px-4 rounded-lg font-medium",
          "transition-colors duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Générer ma routine
          </>
        )}
      </button>

      {/* Generated Routine */}
      {routine && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-lg mb-4">{routine.title}</h3>
          
          <div className="space-y-3 mb-4">
            {routine.activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
              >
                <span className="text-sm font-medium">{activity.start}</span>
                <span>{activity.label}</span>
                <span className="text-sm text-gray-500">({activity.duration}min)</span>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">Récurrence</h4>
            <div className="flex flex-wrap gap-2">
              {routine.recurrence.map((day, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={saveRoutine}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "bg-green-600 hover:bg-green-700 text-white",
              "py-2 px-4 rounded-lg font-medium",
              "transition-colors duration-200"
            )}
          >
            <ListChecks className="w-5 h-5" />
            Sauvegarder la routine
          </button>
        </div>
      )}
    </div>
  );
}