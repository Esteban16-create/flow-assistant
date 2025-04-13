import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Sparkles, Target, Compass, Heart, Loader2 } from 'lucide-react';
import VoiceCapture from '../components/clarity/VoiceCapture';

interface VisionData {
  who: string;
  where: string;
  why: string;
}

export default function Vision() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vision, setVision] = useState<VisionData>({
    who: '',
    where: '',
    why: '',
  });

  const handleSave = async () => {
    if (!user?.id || loading) return;

    setLoading(true);
    setError('');

    try {
      const { error: saveError } = await supabase
        .from('user_profiles')
        .update({
          vision: vision,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (saveError) throw saveError;
    } catch (err: any) {
      console.error('Error saving vision:', err);
      setError('Erreur lors de la sauvegarde de votre vision');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (field: keyof VisionData) => (text: string) => {
    setVision(prev => ({
      ...prev,
      [field]: text,
    }));
  };

  const QuestionCard = ({
    icon: Icon,
    title,
    description,
    value,
    onChange,
    field,
  }: {
    icon: typeof Target;
    title: string;
    description: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    field: keyof VisionData;
  }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={onChange}
        className={cn(
          "w-full p-4 rounded-lg border min-h-[120px] resize-none mb-4",
          "bg-gray-50 dark:bg-gray-800",
          "border-gray-300 dark:border-gray-600",
          "text-gray-900 dark:text-white",
          "placeholder-gray-500 dark:placeholder-gray-400",
          "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
          "transition-colors duration-200"
        )}
        placeholder="Exprimez-vous librement..."
      />

      <VoiceCapture onResult={handleVoiceInput(field)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        <h1 className="text-2xl font-bold">Vision long terme</h1>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1">
        <QuestionCard
          icon={Target}
          title="Qui suis-je ?"
          description="Décrivez qui vous êtes vraiment, vos valeurs, vos forces..."
          value={vision.who}
          onChange={(e) => setVision(prev => ({ ...prev, who: e.target.value }))}
          field="who"
        />

        <QuestionCard
          icon={Compass}
          title="Où je vais ?"
          description="Quelle est votre destination ? Vos objectifs à long terme ?"
          value={vision.where}
          onChange={(e) => setVision(prev => ({ ...prev, where: e.target.value }))}
          field="where"
        />

        <QuestionCard
          icon={Heart}
          title="Pourquoi je fais ça ?"
          description="Quel est votre moteur ? Qu'est-ce qui vous anime ?"
          value={vision.why}
          onChange={(e) => setVision(prev => ({ ...prev, why: e.target.value }))}
          field="why"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
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
              Sauvegarde...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Sauvegarder ma vision
            </>
          )}
        </button>
      </div>
    </div>
  );
}