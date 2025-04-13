import { useTranslation } from 'react-i18next';
import ProgressChart from '../components/progression/ProgressChart';
import FlowCalculator from '../components/progression/FlowCalculator';
import FlowWeekStats from '../components/progression/FlowWeekStats';
import DailyReview from '../components/DailyReview';
import TaskList from '../components/TaskList';

export default function Progress() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.progress')}</h1>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Mes tâches</h2>
            <TaskList />
          </div>
          <FlowWeekStats />
          <ProgressChart />
        </div>
        <div className="space-y-6">
          <FlowCalculator />
          <DailyReview />
        </div>
      </div>
    </div>
  );
}