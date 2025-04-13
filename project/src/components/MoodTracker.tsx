import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Laugh, Smile, Meh, Frown, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase, type Mood } from '../lib/supabase';
import Button from './ui/Button';

interface MoodTrackerProps {
  userId: string;
}

type MoodType = 'great' | 'good' | 'okay' | 'meh' | 'bad';

const moods: { value: MoodType; icon: typeof Smile; color: string }[] = [
  { value: 'great', icon: Laugh, color: 'text-green-500 dark:text-green-400' },
  { value: 'good', icon: Smile, color: 'text-emerald-500 dark:text-emerald-400' },
  { value: 'okay', icon: Meh, color: 'text-yellow-500 dark:text-yellow-400' },
  { value: 'meh', icon: Frown, color: 'text-orange-500 dark:text-orange-400' },
  { value: 'bad', icon: AlertCircle, color: 'text-red-500 dark:text-red-400' },
];

export default function MoodTracker({ userId }: MoodTrackerProps) {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [todaysMood, setTodaysMood] = useState<Mood | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchTodaysMood = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      try {
        const { data, error } = await supabase
          .from('moods')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching mood:', error);
          return;
        }

        if (data) {
          setTodaysMood(data);
          setSelectedMood(data.mood as MoodType);
        }
      } catch (error) {
        console.error('Error in fetchTodaysMood:', error);
      }
    };

    fetchTodaysMood();
  }, [userId]);

  const handleSaveMood = async () => {
    if (!selectedMood || !userId || isLoading) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('moods').insert({
        user_id: userId,
        mood: selectedMood,
      });

      if (error) throw error;

      setTodaysMood({
        id: '', // Will be set by Supabase
        user_id: userId,
        mood: selectedMood,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">{t('dashboard.mood.title')}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{t('dashboard.mood.question')}</p>
      
      <div className="grid grid-cols-5 gap-2 mb-6">
        {moods.map(({ value, icon: Icon, color }) => (
          <Button
            key={value}
            variant="ghost"
            onClick={() => setSelectedMood(value)}
            disabled={isLoading}
            className={cn(
              'flex flex-col items-center gap-2 p-3 h-auto',
              selectedMood === value && 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary-500'
            )}
          >
            <Icon className={cn('w-8 h-8', color)} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t(`dashboard.mood.${value}`)}
            </span>
          </Button>
        ))}
      </div>

      <Button
        variant="primary"
        onClick={handleSaveMood}
        disabled={!selectedMood || isLoading || (todaysMood?.mood === selectedMood)}
        className="w-full"
      >
        {isLoading ? '...' : t('dashboard.mood.save')}
      </Button>
    </div>
  );
}