import React from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  id,
  children,
}) => {
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-bold text-slate-800 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
      </div>
      {children}
      {helperText && !error && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-semibold" role="alert">{error}</p>
      )}
    </div>
  );
};
