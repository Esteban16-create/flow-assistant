import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Plus, Loader2 } from 'lucide-react';

interface QuickEventAddProps {
  onAdded: () => void;
}

const CATEGORIES = [
  { id: 'pro', label: 'Pro', emoji: '🧠' },
  { id: 'perso', label: 'Personnel', emoji: '👨‍👩‍👧' },
  { id: 'pause', label: 'Pause', emoji: '☕' },
  { id: 'hybride', label: 'Hybride', emoji: '🔀' },
] as const;

type Category = typeof CATEGORIES[number]['id'];

export default function QuickEventAdd({ onAdded }: QuickEventAddProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [withPause, setWithPause] = useState(false);
  const [pauseHours, setPauseHours] = useState(0);
  const [pauseMinutes, setPauseMinutes] = useState(10);
  const [category, setCategory] = useState<Category>('pro');
  const [loading, setLoading] = useState(false);

  const getEmoji = (cat: Category) => {
    return CATEGORIES.find(c => c.id === cat)?.emoji || '';
  };

  const createEvent = async () => {
    if (!title || !date || !time) return alert("Remplis tous les champs 🧠");
    if (!user?.id || loading) return;

    setLoading(true);

    try {
      const start = new Date(`${date}T${time}`);
      const duration = durationHours * 60 + durationMinutes;
      const end = new Date(start.getTime() + duration * 60000);

      // Add emoji to title based on category
      const finalTitle = `${getEmoji(category)} ${title}`;

      // Create main event
      await supabase.from('events').insert({
        user_id: user.id,
        title: finalTitle,
        start: start.toISOString(),
        end: end.toISOString(),
        category,
        color: category === 'pro' ? '#7C3AED' : 
               category === 'perso' ? '#10B981' : 
               category === 'pause' ? '#9CA3AF' : 
               '#8B5CF6', // hybride
      });

      // Create pause event if enabled
      if (withPause) {
        const pauseDuration = pauseHours * 60 + pauseMinutes;
        await supabase.from('events').insert({
          user_id: user.id,
          title: '☕ Pause',
          start: end.toISOString(),
          end: new Date(end.getTime() + pauseDuration * 60000).toISOString(),
          category: 'pause',
          color: '#9CA3AF',
        });
      }

      // Reset form
      setTitle('');
      setDate('');
      setTime('');
      setDurationHours(1);
      setDurationMinutes(0);
      setWithPause(false);
      setPauseHours(0);
      setPauseMinutes(10);
      setCategory('pro');
      onAdded();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md space-y-4">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Ajouter un créneau rapide
      </h3>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder={`${getEmoji(category)} Titre de l'événement`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg border",
              "bg-gray-50 dark:bg-gray-800",
              "border-gray-300 dark:border-gray-600",
              "text-gray-900 dark:text-white",
              "placeholder-gray-500 dark:placeholder-gray-400",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium",
                "transition-colors duration-200",
                category === cat.id
                  ? "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={cn(
              "px-3 py-2 rounded-lg border",
              "bg-gray-50 dark:bg-gray-800",
              "border-gray-300 dark:border-gray-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            )}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={cn(
              "px-3 py-2 rounded-lg border",
              "bg-gray-50 dark:bg-gray-800",
              "border-gray-300 dark:border-gray-600",
              "text-gray-900 dark:text-white",
              "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Heures
            </label>
            <input
              type="number"
              min={0}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className={cn(
                "w-full px-3 py-2 rounded-lg border",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              )}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Minutes
            </label>
            <input
              type="number"
              min={0}
              max={59}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
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

        <p className="text-sm text-gray-600 dark:text-gray-400">
          ⏱️ Durée totale : {durationHours}h {durationMinutes}min
        </p>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={withPause}
            onChange={() => setWithPause(!withPause)}
            className={cn(
              "rounded border-gray-300 text-primary-600",
              "focus:ring-primary-500",
              "dark:border-gray-600 dark:bg-gray-800"
            )}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Ajouter une pause après ?
          </span>
        </label>

        {withPause && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Heures pause
              </label>
              <input
                type="number"
                min={0}
                value={pauseHours}
                onChange={(e) => setPauseHours(Number(e.target.value))}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border",
                  "bg-gray-50 dark:bg-gray-800",
                  "border-gray-300 dark:border-gray-600",
                  "text-gray-900 dark:text-white",
                  "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                )}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                Minutes pause
              </label>
              <input
                type="number"
                min={0}
                max={59}
                value={pauseMinutes}
                onChange={(e) => setPauseMinutes(Number(e.target.value))}
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
        )}

        <button
          onClick={createEvent}
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
            'Ajouter à l\'agenda'
          )}
        </button>
      </div>
    </div>
  );
}