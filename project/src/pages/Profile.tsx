import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { 
  User,
  FileText,
  Shield,
  AlertTriangle,
  LogOut,
  Loader2,
  Save,
  Globe,
  Moon,
  Settings,
  Key
} from 'lucide-react';

interface Profile {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    bio: '',
    avatar_url: '',
    created_at: null
  });

  useEffect(() => {
    if (!user?.id) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            full_name: data.full_name,
            bio: data.bio,
            avatar_url: data.avatar_url,
            created_at: user.created_at
          });
        }
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || saving) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('profile.deleteAccountConfirm'))) return;

    setDeleteLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.admin.deleteUser(user?.id as string);
      if (error) throw error;

      await signOut();
      navigate('/login');
    } catch (err: any) {
      setError(t('auth.errors.deleteAccountFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err: any) {
      setError('Failed to sign out');
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👤 {t('profile.title')}</h1>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">{t('profile.accountInfo')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('profile.email')}
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          {profile.created_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('profile.createdAt')}
              </label>
              <p className="mt-1 text-gray-900 dark:text-white">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{t('profile.title')}</h2>
          {success && (
            <span className="text-green-600 dark:text-green-400 text-sm">
              Profile updated successfully!
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className={cn(
                "mt-1 block w-full rounded-lg",
                "border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "shadow-sm",
                "focus:border-primary-500 focus:ring-primary-500"
              )}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
            </label>
            <textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className={cn(
                "mt-1 block w-full rounded-lg",
                "border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "shadow-sm",
                "focus:border-primary-500 focus:ring-primary-500"
              )}
            />
          </div>

          <div>
            <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Avatar URL
            </label>
            <input
              type="url"
              id="avatar_url"
              value={profile.avatar_url || ''}
              onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              className={cn(
                "mt-1 block w-full rounded-lg",
                "border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "shadow-sm",
                "focus:border-primary-500 focus:ring-primary-500"
              )}
            />
            {profile.avatar_url && (
              <div className="mt-2">
                <img
                  src={profile.avatar_url}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-2",
              "w-full px-4 py-2 rounded-lg",
              "bg-primary-600 hover:bg-primary-700",
              "text-white font-medium",
              "transition-colors duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">{t('profile.settings')}</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>{t('profile.darkMode')}</span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "px-3 py-1 rounded-lg",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "transition-colors duration-200"
              )}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span>{t('profile.language')}</span>
            </div>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className={cn(
                "px-3 py-1 rounded-lg",
                "bg-gray-100 dark:bg-gray-800",
                "text-gray-900 dark:text-white",
                "border border-gray-300 dark:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-primary-500"
              )}
            >
              <option value="fr">{t('profile.fr')}</option>
              <option value="en">{t('profile.en')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4">{t('profile.legal')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {t('profile.termsTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('profile.termsContent')}
            </p>
          </div>

          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              {t('profile.privacyTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('profile.privacyContent')}
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-red-200 dark:border-red-800 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          {t('profile.dangerZone')}
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              {t('profile.deleteAccount')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('profile.deleteAccountDesc')}
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className={cn(
                "flex items-center justify-center gap-2",
                "px-4 py-2 rounded-lg",
                "bg-red-100 hover:bg-red-200",
                "text-red-700 font-medium",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {deleteLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              {t('profile.deleteAccountButton')}
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className={cn(
              "flex items-center justify-center gap-2",
              "w-full px-4 py-2 rounded-lg",
              "bg-red-100 hover:bg-red-200",
              "text-red-700 font-medium",
              "transition-colors duration-200"
            )}
          >
            <LogOut className="w-5 h-5" />
            {t('auth.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
}