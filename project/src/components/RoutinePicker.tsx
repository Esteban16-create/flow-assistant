import { useState } from 'react';
import { cn } from '../lib/utils';

export interface Routine {
  id: string;
  name: string;
  description: string;
}

const routines: Routine[] = [
  {
    id: 'miracle-morning',
    name: '🌅 Miracle Morning',
    description: 'Réveil à 6h, sport, méditation, écriture, lecture.',
  },
  {
    id: 'flow-mode',
    name: '🧘 Flow Mode',
    description: 'Pas de distractions. Création pure. Tâches prioritaires only.',
  },
  {
    id: 'reset-day',
    name: '🔄 Reset Day',
    description: 'Ménage digital, planification, detox, recentrage.',
  },
  {
    id: 'focus-beast',
    name: '💪 Focus Beast',
    description: 'Pomodoro, 0 notifications, musique alpha, objectif x3.',
  },
];

interface RoutinePickerProps {
  onSelect: (id: string) => void;
}

export default function RoutinePicker({ onSelect }: RoutinePickerProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {routines.map((routine) => (
        <div
          key={routine.id}
          onClick={() => handleClick(routine.id)}
          className={cn(
            "p-6 rounded-xl border cursor-pointer transition-all duration-200",
            "hover:shadow-md hover:scale-[1.02]",
            "bg-white dark:bg-gray-800",
            selected === routine.id
              ? "border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20"
              : "border-gray-200 dark:border-gray-700"
          )}
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {routine.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {routine.description}
          </p>
        </div>
      ))}
    </div>
  );
}