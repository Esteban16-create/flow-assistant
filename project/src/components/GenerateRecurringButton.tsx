import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Loader2, Calendar } from 'lucide-react';

interface GenerateRecurringButtonProps {
  onGenerated?: () => void;
  className?: string;
}

export default function GenerateRecurringButton({ onGenerated, className }: GenerateRecurringButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-recurring`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate recurring events');
      }

      const data = await response.json();
      if (data.success) {
        onGenerated?.();
      }
    } catch (error) {
      console.error('Error generating recurring events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium",
        "bg-primary-600 hover:bg-primary-700 text-white",
        "transition-colors duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <Calendar className="w-5 h-5" />
          Générer mes événements récurrents
        </>
      )}
    </button>
  );
}