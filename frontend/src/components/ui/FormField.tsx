import React from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  id,
  className = '',
  labelClassName = '',
  children,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className={`text-xs font-semibold text-slate-700 flex items-center gap-1 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      </div>
      {children}
      {helperText && !error && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-medium" role="alert">{error}</p>
      )}
    </div>
  );
};
