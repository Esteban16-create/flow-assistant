import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
        
        // Size variations
        size === 'sm' && "px-3 py-1.5 text-sm",
        size === 'md' && "px-4 py-2",
        size === 'lg' && "px-6 py-3 text-lg",
        
        // Variant styles
        variant === 'primary' && "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        variant === 'secondary' && "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        variant === 'ghost' && "hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
        variant === 'danger' && "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        
        // Disabled state
        "disabled:opacity-50 disabled:cursor-not-allowed",
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}