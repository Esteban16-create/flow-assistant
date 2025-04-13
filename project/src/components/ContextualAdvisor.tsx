import { useEffect, useState } from 'react';
import { Lightbulb, Sun, Target, Moon, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ContextualAdvisor() {
  const [suggestion, setSuggestion] = useState('');
  const [icon, setIcon] = useState<typeof Sun>(Sun);

  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 9) {
      setSuggestion('Active ta routine du matin pour démarrer en clarté');
      setIcon(Sun);
    } else if (hour < 12) {
      setSuggestion('Lancer un bloc focus de 25 min ?');
      setIcon(Target);
    } else if (hour < 18) {
      setSuggestion('As-tu finalisé tes tâches importantes du jour ?');
      setIcon(Brain);
    } else {
      setSuggestion('Prends 5 minutes pour faire une rétro mentale');
      setIcon(Moon);
    }
  }, []);

  const Icon = icon;

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 rounded-2xl shadow-md",
      "border border-gray-200 dark:border-gray-700",
      "p-6"
    )}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            Suggestion du moment
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {suggestion}
          </p>
        </div>
      </div>
    </div>
  );
}