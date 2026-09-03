import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label: string; error?: string }

export const PasswordInput: React.FC<Props> = ({ label, error, id, ...props }) => {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return <div>
    <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        {...props}
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder="••••••••••••"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-[52px] w-full rounded-xl border bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:ring-4 ${error ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : 'border-slate-300 focus:border-blue-600 focus:ring-blue-100'}`}
      />
      <button
        type="button"
        onClick={() => setVisible(value => !value)}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {error && <p id={errorId} className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}
  </div>;
};
