import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const sizeClasses = {
    sm: 'h-8 px-3.5 text-xs rounded-xl gap-1.5',
    md: 'h-10 px-4 text-xs sm:text-sm rounded-xl gap-2 shadow-xs',
    lg: 'h-12 px-6 text-sm sm:text-base rounded-xl gap-2.5 shadow-md',
  }[size];

  const variantClasses = {
    primary: 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-xs active:scale-[0.99]',
    secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200',
    outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/70',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs',
  }[variant];

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
