import { useState } from 'react';
import { gainXP } from '../lib/xp';
import { cn } from '../lib/utils';
import { Star, Loader2 } from 'lucide-react';

interface XPGainProps {
  amount: number;
  onComplete?: (xp: number) => void;
  className?: string;
}

export default function XPGain({ amount, onComplete, className }: XPGainProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gained, setGained] = useState(false);

  const handleGainXP = async () => {
    if (loading || gained) return;

    setLoading(true);
    setError('');

    try {
      const { xp } = await gainXP(amount);
      setGained(true);
      onComplete?.(xp);
    } catch (err: any) {
      console.error('Error gaining XP:', err);
      setError('Erreur lors du gain d\'XP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGainXP}
      disabled={loading || gained}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "transition-all duration-200",
        gained
          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Star className="w-5 h-5" />
      )}
      {gained ? `+${amount} XP Gagné !` : `Gagner ${amount} XP`}
    </button>
  );
}