import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Calendar, Clock, ListChecks, Loader2 } from 'lucide-react';

interface RecurringEventFormProps {
  onCreated?: () => void;
}

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const CATEGORIES = [
  { id: 'pro', label: 'Pro', color: '#1e3a8a' },
  { id: 'perso', label: 'Perso', color: '#10b981' },
  { id: 'hybride', label: 'Hybride', color: '#8b5cf6' },
] as const;

type Categorie = typeof CATEGORIES[number]['id'];

export default function RecurringEventForm({ onCreated }: RecurringEventFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [titre, setTitre] = useState('');
  const [heure, setHeure] = useState('08:00');
  const [duree, setDuree] = useState(60);
  const [jours, setJours] = useState(Array(7).fill(false));
  const [categorie, setCategorie] = useState<Categorie>('pro');

  const handleSubmit = async () => {
    if (!user?.id || loading) return;
    if (!titre.trim()) {
      setError('Le titre est requis');
      return;
    }
    if (!jours.some(j => j)) {
      setError('Sélectionnez au moins un jour');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: saveError } = await supabase
        .from('routines')
        .insert({
          user_id: user.id,
          nom: titre,
          heure,
          duree,
          jours,
          categorie,
          couleur: CATEGORIES.find(c => c.id === categorie)?.color,
        });

      if (saveError) throw saveError;

      setTitre('');
      setHeure('08:00');
      setDuree(60);
      setJours(Array(7).fill(false));
      setCategorie('pro');
      onCreated?.();
    } catch (err: any) {
      console.error('Error creating recurring event:', err);
      setError('Erreur lors de la création de l\'événement récurrent');
    } finally {
      setLoading(false);
    }
  };

  const toggleJour = (index: number) => {
    const newJours = [...jours];
    newJours[index] = !newJours[index];
    setJours(newJours);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        Événement récurrent
      </h3>

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Titre (ex: Réunion d'équipe)"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className={cn(
            "w-full px-3 py-2 rounded-lg border",
            "bg-gray-50 dark:bg-gray-800",
            "border-gray-300 dark:border-gray-600",
            "text-gray-900 dark:text-white",
            "placeholder-gray-500 dark:placeholder-gray-400",
            "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Heure de début
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 rounded-lg border",
                  "bg-gray-50 dark:bg-gray-800",
                  "border-gray-300 dark:border-gray-600",
                  "text-gray-900 dark:text-white",
                  "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durée (minutes)
            </label>
            <input
              type="number"
              value={duree}
              onChange={(e) => setDuree(Math.max(15, Number(e.target.value)))}
              min={15}
              step={15}
              className={cn(
                "w-full px-3 py-2 rounded-lg border",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Jours de répétition
          </label>
          <div className="flex flex-wrap gap-2">
            {JOURS.map((jour, index) => (
              <button
                key={index}
                onClick={() => toggleJour(index)}
                className={cn(
                  "w-10 h-10 rounded-lg font-medium",
                  "transition-colors duration-200",
                  jours[index]
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                {jour}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Catégorie
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategorie(cat.id)}
                className={cn(
                  "py-2 px-4 rounded-lg font-medium",
                  "transition-colors duration-200",
                  categorie === cat.id
                    ? "bg-primary-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
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
              Création...
            </>
          ) : (
            <>
              <ListChecks className="w-5 h-5" />
              Créer l'événement récurrent
            </>
          )}
        </button>
      </div>
    </div>
  );
}