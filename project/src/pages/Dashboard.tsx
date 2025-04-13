import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Users, Timer, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import { calculateUserStats, type UserStats } from '../lib/stats';
import DashboardTasks from '../components/DashboardTasks';
import HistoryList from '../components/HistoryList';
import MoodTracker from '../components/MoodTracker';
import XPCard from '../components/XPCard';
import FlowWeekStats from '../components/progression/FlowWeekStats';
import ContextualAdvisor from '../components/ContextualAdvisor';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    tasksCompleted: 0,
    meetingsCount: 0,
    focusTime: 0,
    streak: 0
  });

  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      const userStats = await calculateUserStats(user.id);
      setStats(userStats);
    };

    loadStats();
  }, [user]);

  const statItems = [
    { 
      icon: CheckCircle2, 
      value: `${stats.tasksCompleted}/8`, 
      label: t('dashboard.stats.tasks') 
    },
    { 
      icon: Users, 
      value: stats.meetingsCount.toString(), 
      label: t('dashboard.stats.meetings') 
    },
    { 
      icon: Timer, 
      value: `${Math.floor(stats.focusTime / 60)}h ${stats.focusTime % 60}m`, 
      label: t('dashboard.stats.focus') 
    },
    { 
      icon: Flame, 
      value: stats.streak.toString(), 
      label: t('dashboard.stats.streak') 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">{t('dashboard.welcome')}</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t('dashboard.description')}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Connecté en tant que : <strong className="text-gray-900 dark:text-white">{user?.email}</strong>
          </p>
        </div>

        <XPCard />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <MoodTracker userId={user?.id || ''} />

        {/* Stats Grid */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.stats.title')}</h3>
          <div className="grid grid-cols-2 gap-4">
            {statItems.map(({ icon: Icon, value, label }) => (
              <div key={label} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                <Icon className="w-6 h-6 mx-auto mb-2 text-primary-600 dark:text-primary-400" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks, History, and Flow Stats Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DashboardTasks />
          <FlowWeekStats />
        </div>
        <div className="space-y-6">
          <ContextualAdvisor />
          <HistoryList />
        </div>
      </div>
    </div>
  );
}