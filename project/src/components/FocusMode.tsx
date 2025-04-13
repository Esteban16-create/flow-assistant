import { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface Routine {
  id: string;
  nom: string;
  description: string | null;
  etapes: string[];
  active: boolean;
  created_at: string;
}

interface FocusModeProps {
  routine: Routine;
}

export default function FocusMode({ routine }: FocusModeProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min par défaut

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const nextStep = () => {
    setStepIndex((prev) => Math.min(prev + 1, routine.etapes.length - 1));
    setTimeLeft(25 * 60);
    setIsRunning(false);
  };

  if (!routine) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Focus Mode
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Étape {stepIndex + 1} / {routine.etapes.length}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-lg font-medium text-gray-900 dark:text-white text-center">
            {routine.etapes[stepIndex]}
          </p>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-5xl font-mono font-bold text-primary-600 dark:text-primary-400">
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-medium",
              "transition-colors duration-200",
              isRunning
                ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
                : "bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Démarrer
              </>
            )}
          </button>

          <button
            onClick={nextStep}
            disabled={stepIndex === routine.etapes.length - 1}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-medium",
              "bg-green-100 text-green-700 hover:bg-green-200",
              "dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30",
              "transition-colors duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <SkipForward className="w-5 h-5" />
            Étape suivante
          </button>
        </div>
      </div>
    </div>
  );
}