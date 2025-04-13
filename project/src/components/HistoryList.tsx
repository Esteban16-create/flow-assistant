import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ScrollText, Loader2, Plus } from 'lucide-react';

interface Note {
  id: string;
  contenu: string;
  created_at: string;
}

export default function HistoryList() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('expression_libre')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setNotes(data || []);
      } catch (err: any) {
        console.error('Error fetching notes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  const scrollToInput = () => {
    const inputSection = document.getElementById('mental-clarity-input');
    if (inputSection) {
      inputSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-red-600 dark:text-red-400 text-sm">
          Une erreur est survenue lors du chargement de l'historique.
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-6 space-y-4">
          <ScrollText className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Aucune entrée pour le moment
            </p>
            <button
              onClick={scrollToInput}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary-50 text-primary-700 hover:bg-primary-100",
                "dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30",
                "transition-colors duration-200"
              )}
            >
              <Plus className="w-5 h-5" />
              Ajouter une entrée
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fr', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        Dernières entrées
      </h3>
      
      <div className="space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={cn(
              "p-3 rounded-lg",
              "bg-gray-50 dark:bg-gray-800",
              "border border-gray-200 dark:border-gray-700"
            )}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {note.contenu.length > 120
                ? `${note.contenu.slice(0, 120)}...`
                : note.contenu}
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {formatDate(note.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}