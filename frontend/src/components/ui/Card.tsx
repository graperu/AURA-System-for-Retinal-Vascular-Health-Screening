import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'bordered' | 'interactive' | 'hero';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200';

  const variantClasses = {
    default: 'bg-clinical-surface border border-clinical-border shadow-medical-card',
    subtle: 'bg-clinical-surface-subtle border border-clinical-border-subtle',
    bordered: 'bg-clinical-surface border border-clinical-border shadow-medical-sm',
    interactive: 'bg-clinical-surface border border-clinical-border shadow-medical-card hover:border-brand-600 hover:shadow-medical-md hover:-translate-y-0.5 cursor-pointer group',
    hero: 'bg-gradient-to-r from-brand-900 to-slate-900 text-white border border-slate-800 shadow-medical-md',
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div className={`${baseClasses} ${variantClasses} ${paddingClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center justify-between pb-4 border-b border-clinical-border-subtle ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-base font-bold text-clinical-text flex items-center gap-2 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`pt-4 ${className}`} {...props}>
    {children}
  </div>
);
