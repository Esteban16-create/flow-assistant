import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2, User, Link as LinkIcon, FileText, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function EditProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    avatar_url: '',
    bio: ''
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            bio: data.bio
          });
        }
      } catch (error: any) {
        console.error('Error loading profile:', error.message);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      loadProfile();
    }
  }, [user]);

  const handleChange = async (field: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user?.id,
          [field]: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSaveMessage('✓ Enregistré');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Modifier mon profil
        </h2>
        {(saving || saveMessage) && (
          <div className="flex items-center gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
            ) : (
              <span className="text-sm text-green-600 dark:text-green-400 animate-fade-in-out">
                {saveMessage}
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-6">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nom complet
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="full_name"
              type="text"
              value={profile.full_name || ''}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "transition-colors duration-200"
              )}
              placeholder="Votre nom complet"
            />
          </div>
        </div>

        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL de la photo
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="avatar_url"
              type="url"
              value={profile.avatar_url || ''}
              onChange={(e) => handleChange('avatar_url', e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "transition-colors duration-200"
              )}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          {profile.avatar_url && (
            <div className="mt-2">
              <img
                src={profile.avatar_url}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={4}
              className={cn(
                "w-full pl-10 pr-4 py-2 rounded-lg border",
                "bg-gray-50 dark:bg-gray-800",
                "border-gray-300 dark:border-gray-600",
                "text-gray-900 dark:text-white",
                "placeholder-gray-500 dark:placeholder-gray-400",
                "focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                "transition-colors duration-200",
                "resize-none"
              )}
              placeholder="Parlez-nous un peu de vous..."
            />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Une courte description qui apparaîtra sur votre profil
          </p>
        </div>
      </div>
    </div>
  );
}