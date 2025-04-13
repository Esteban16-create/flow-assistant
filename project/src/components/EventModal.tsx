import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  startTime: string;
  endTime: string;
}

export default function EventModal({ isOpen, onClose, onSubmit, startTime, endTime }: EventModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError(t('agenda.errors.titleRequired'));
      return;
    }

    onSubmit(title.trim());
    setTitle('');
    setError('');
    onClose();
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('agenda.newEvent')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('agenda.eventTitle')}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              )}
              placeholder={t('agenda.eventTitlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{t('agenda.start')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(startTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{t('agenda.end')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(endTime)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "bg-gray-100 hover:bg-gray-200",
                "dark:bg-gray-800 dark:hover:bg-gray-700",
                "text-gray-700 dark:text-gray-300",
                "transition-colors duration-200"
              )}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "bg-primary-600 hover:bg-primary-700",
                "text-white",
                "transition-colors duration-200"
              )}
            >
              {t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}