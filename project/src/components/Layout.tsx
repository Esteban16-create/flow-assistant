import { ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart, Brain, User, ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import ChatAgentWrapper from './ChatAgentWrapper';

export default function Layout() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActiveRoute = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { path: '/agenda', icon: Calendar, label: t('nav.agenda') },
    { path: '/progress', icon: BarChart, label: t('nav.progress') },
    { path: '/mental-clarity', icon: Brain, label: t('nav.mentalClarity') },
    { path: '/routines', icon: ListChecks, label: t('nav.routines') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const NavLink = ({ path, icon: Icon, label }: { path: string; icon: typeof Home; label: string }) => {
    const isActive = isActiveRoute(path);
    return (
      <Link 
        to={path} 
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
          "hover:bg-primary-100 dark:hover:bg-primary-900/20",
          isActive && "bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
        )}
      >
        <Icon className={cn(
          "w-5 h-5",
          isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
        )} />
        <span>{label}</span>
      </Link>
    );
  };

  const MobileNavLink = ({ path, icon: Icon, label }: { path: string; icon: typeof Home; label: string }) => {
    const isActive = isActiveRoute(path);
    return (
      <Link 
        to={path} 
        className={cn(
          "flex flex-col items-center gap-1 py-2",
          "hover:text-primary-600 dark:hover:text-primary-400 transition-colors",
          isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-gray-300"
        )}
      >
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/80 dark:border-gray-700/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              Flow Assistant
            </h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.path} {...item} />
            ))}
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-t border-gray-200/80 dark:border-gray-700/80 px-4 flex justify-around">
        {navItems.map((item) => (
          <MobileNavLink key={item.path} {...item} />
        ))}
      </nav>

      <ChatAgentWrapper />
    </div>
  );
}