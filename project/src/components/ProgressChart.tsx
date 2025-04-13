import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartData {
  date: string;
  temps: number;
  taches: number;
}

export default function ProgressChart() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('created_at, duree')
          .eq('status', 'terminée')
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (!tasks) {
          setData([]);
          return;
        }

        // Group by day
        const grouped = tasks.reduce((acc: Record<string, ChartData>, task) => {
          const date = new Date(task.created_at).toLocaleDateString('fr-FR');
          if (!acc[date]) {
            acc[date] = { date, temps: 0, taches: 0 };
          }
          acc[date].temps += task.duree || 0;
          acc[date].taches += 1;
          return acc;
        }, {});

        // Convert to array and sort by date
        const chartData = Object.values(grouped).sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setData(chartData);
      } catch (err: any) {
        console.error('Error fetching progress data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-red-600 dark:text-red-400 text-center py-8">
          Une erreur est survenue lors du chargement des données.
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          Aucune donnée de progression disponible.
        </div>
      </div>
    );
  }

  const totalTime = data.reduce((sum, d) => sum + d.temps, 0);
  const totalTasks = data.reduce((sum, d) => sum + d.taches, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          📈 Progression
        </h2>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {totalTasks}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tâches terminées
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {Math.round(totalTime / 60)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Temps gagné
            </div>
          </div>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              yAxisId="left"
              label={{ 
                value: 'Temps (min)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#6B7280' }
              }}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fill: '#6B7280' }}
              yAxisId="right" 
              orientation="right"
              label={{ 
                value: 'Tâches', 
                angle: 90, 
                position: 'insideRight',
                style: { fill: '#6B7280' }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#9CA3AF' }}
              itemStyle={{ color: '#E5E7EB' }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temps"
              stroke="#7C3AED"
              strokeWidth={2}
              name="Temps"
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="taches"
              stroke="#60A5FA"
              strokeWidth={2}
              name="Tâches"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}