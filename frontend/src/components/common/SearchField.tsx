import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  autoFocus?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder,
  className = '',
  debounceMs = 300,
  autoFocus = false,
}) => {
  const { isVi } = useLanguage();
  const [internalValue, setInternalValue] = useState(controlledValue || '');

  // Sync with controlled value if changed outside
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Handle debounced search triggers
  useEffect(() => {
    if (!onSearch) return;

    const timer = setTimeout(() => {
      onSearch(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    onSearch?.('');
  };

  const defaultPlaceholder = isVi
    ? 'Tìm kiếm bệnh nhân, mã hồ sơ, ca khám...'
    : 'Search patients, MRN, examinations...';

  return (
    <div className={`relative flex items-center ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <Search className="h-4 w-4 text-[#98A2B3]" aria-hidden="true" />
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        autoFocus={autoFocus}
        placeholder={placeholder || defaultPlaceholder}
        className="h-10 w-full rounded-xl border border-[#EAECF0] bg-[#F5F6F8] pl-10 pr-9 text-xs text-[#111827] placeholder:text-[#98A2B3] transition-all duration-150 focus:border-[#3478F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3478F6]/15"
      />

      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#98A2B3] hover:text-[#111827] transition-colors"
          aria-label={isVi ? 'Xóa nội dung tìm kiếm' : 'Clear search'}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
