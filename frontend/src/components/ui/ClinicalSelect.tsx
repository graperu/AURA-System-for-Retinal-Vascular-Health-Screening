import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

export interface ClinicalSelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  riskLevel?: 'low' | 'moderate' | 'high' | 'critical' | 'unverified';
}

export interface ClinicalSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: ClinicalSelectOption<T>[];
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  isDarkRoom?: boolean;
  darkroom?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  placement?: 'auto' | 'bottom' | 'top';
  align?: 'left' | 'right';
  id?: string;
  name?: string;
  ariaLabel?: string;
}

const RISK_DOT_COLORS = {
  low: 'bg-[#16A34A]',
  moderate: 'bg-[#D97706]',
  high: 'bg-[#EA580C]',
  critical: 'bg-[#DC2626]',
  unverified: 'bg-[#64748B]',
} as const;

export function ClinicalSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Chọn một tùy chọn...',
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  isDarkRoom = false,
  darkroom = false,
  size = 'md',
  className = '',
  triggerClassName = '',
  menuClassName = '',
  placement = 'auto',
  align = 'left',
  id,
  name,
  ariaLabel,
}: ClinicalSelectProps<T>) {
  const effectiveDarkRoom = Boolean(isDarkRoom || darkroom);
  const [isOpen, setIsOpen] = useState(false);
  const [openAbove, setOpenAbove] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const generatedId = useId();
  const selectId = id || `clinical-select-${generatedId}`;
  const listboxId = `${selectId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Determine menu placement (auto flip when bottom screen margin is tight)
  const calculatePlacement = useCallback(() => {
    if (placement === 'top') {
      setOpenAbove(true);
      return;
    }
    if (placement === 'bottom') {
      setOpenAbove(false);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeightEstimate = Math.min(options.length * 48 + 16, 260);

      if (spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow) {
        setOpenAbove(true);
      } else {
        setOpenAbove(false);
      }
    }
  }, [placement, options.length]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Sync highlighted index with current selected value when opened
  useEffect(() => {
    if (isOpen) {
      calculatePlacement();
      const idx = options.findIndex((opt) => opt.value === value);
      const firstEnabledIdx = options.findIndex((opt) => !opt.disabled);
      setHighlightedIndex(idx >= 0 ? idx : Math.max(0, firstEnabledIdx));
    }
  }, [isOpen, calculatePlacement, value, options]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Keyboard navigation complying with WCAG 2.1 AA
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) {
          if (highlightedIndex >= 0 && options[highlightedIndex] && !options[highlightedIndex].disabled) {
            onChange(options[highlightedIndex].value);
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        } else {
          setIsOpen(true);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev + 1;
            while (next < options.length && options[next]?.disabled) {
              next++;
            }
            return next < options.length ? next : prev;
          });
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => {
            let next = prev - 1;
            while (next >= 0 && options[next]?.disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          const firstNonDisabled = options.findIndex((opt) => !opt.disabled);
          if (firstNonDisabled >= 0) setHighlightedIndex(firstNonDisabled);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setHighlightedIndex(i);
              break;
            }
          }
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;

      default:
        break;
    }
  };

  const handleSelectOption = (option: ClinicalSelectOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Dimensions based on size prop
  const sizeStyles = {
    sm: {
      trigger: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
      option: 'py-1.5 px-2.5 text-xs',
      icon: 'w-3.5 h-3.5',
    },
    md: {
      trigger: 'h-9 sm:h-10 px-3 text-xs sm:text-sm rounded-xl gap-2',
      option: 'py-2 px-3 text-xs sm:text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      trigger: 'h-11 sm:h-12 px-3.5 text-sm sm:text-base rounded-xl gap-2.5',
      option: 'py-2.5 px-3.5 text-sm',
      icon: 'w-4 h-4 sm:w-5 sm:h-5',
    },
  }[size];

  // Theme styling
  const triggerThemeStyles = effectiveDarkRoom
    ? isOpen
      ? 'bg-[#0F172A] text-[#F8FAFC] border-cyan-400 ring-2 ring-cyan-500/25 shadow-medical-sm'
      : 'bg-[#0B132B] text-[#F8FAFC] border-[#1E293B] hover:border-cyan-500/50 hover:bg-[#0F172A]'
    : isOpen
    ? 'bg-white text-clinical-text border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-medical-xs'
    : 'bg-white text-clinical-text border-clinical-border hover:border-brand-400 hover:bg-slate-50/60';

  const menuThemeStyles = effectiveDarkRoom
    ? 'bg-[#0F172A] border-[#1E293B] text-[#F8FAFC] darkroom-scrollbar'
    : 'bg-white border-clinical-border text-clinical-text clinical-scrollbar';

  // Only apply default w-full if no custom width class is provided in className
  const hasCustomWidth = /(?:^|\s)(?:w-|max-w-|min-w-|flex-1)/.test(className);
  const containerWidthClass = hasCustomWidth ? '' : 'w-full';

  return (
    <div className={`relative ${containerWidthClass} ${className}`.trim()} ref={containerRef}>
      {/* Optional Top Label */}
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={selectId}
            className={`block text-xs font-semibold ${
              effectiveDarkRoom ? 'text-slate-200' : 'text-clinical-text'
            } flex items-center gap-1`}
          >
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </label>
        </div>
      )}

      {/* Hidden Native Select for standard form serialization, testing & accessibility */}
      <select
        id={name ? undefined : `${selectId}-native`}
        name={name}
        value={String(value)}
        onChange={(e) => {
          const rawVal = e.target.value;
          const matched = options.find((opt) => String(opt.value) === rawVal);
          onChange(matched ? matched.value : (rawVal as unknown as T));
        }}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Custom Trigger Button */}
      <button
        type="button"
        id={selectId}
        ref={triggerRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && highlightedIndex >= 0 ? `${selectId}-opt-${highlightedIndex}` : undefined
        }
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between border font-medium text-left transition-all duration-150 outline-none select-none ${
          sizeStyles.trigger
        } ${triggerThemeStyles} ${
          error ? 'border-red-400 ring-2 ring-red-400/20' : ''
        } ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'cursor-pointer'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-[#0891B2]">{selectedOption.icon}</span>
          )}
          {selectedOption?.riskLevel && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${RISK_DOT_COLORS[selectedOption.riskLevel]}`}
              aria-hidden="true"
            />
          )}
          <span
            className="truncate block font-semibold"
            title={selectedOption ? selectedOption.label : placeholder}
          >
            {selectedOption ? selectedOption.label : (
              <span className="text-slate-400">
                {placeholder}
              </span>
            )}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0">{selectedOption.badge}</span>
          )}
        </div>

        <ChevronDown
          className={`shrink-0 text-slate-400 transition-transform duration-200 ease-out ${
            sizeStyles.icon
          } ${isOpen ? 'rotate-180 text-[#0891B2]' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <ul
          id={listboxId}
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || label || 'Danh sách lựa chọn'}
          className={`absolute z-50 w-full min-w-[180px] max-h-64 overflow-y-auto rounded-xl border p-1 shadow-medical-card animate-dropdown-enter ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${
            openAbove ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${menuThemeStyles} ${menuClassName}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightedIndex;

            let itemTheme = '';
            if (option.disabled) {
              itemTheme = effectiveDarkRoom
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'opacity-40 cursor-not-allowed text-slate-400';
            } else if (isSelected) {
              itemTheme = effectiveDarkRoom
                ? 'bg-cyan-950/70 text-cyan-300 font-bold border-l-2 border-cyan-400'
                : 'bg-brand-50 text-[#0891B2] font-bold border-l-2 border-[#0891B2]';
            } else if (isHighlighted) {
              itemTheme = effectiveDarkRoom
                ? 'bg-slate-800 text-slate-100'
                : 'bg-slate-100 text-slate-900';
            } else {
              itemTheme = effectiveDarkRoom
                ? 'text-slate-200 hover:bg-slate-800/80 hover:text-slate-100'
                : 'text-clinical-text-secondary hover:bg-slate-50 hover:text-clinical-text';
            }

            return (
              <li
                key={String(option.value)}
                id={`${selectId}-opt-${index}`}
                role="option"
                title={option.label}
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => handleSelectOption(option)}
                onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                className={`group flex items-center justify-between rounded-lg cursor-pointer transition-colors duration-100 ${
                  sizeStyles.option
                } ${itemTheme}`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {option.icon && (
                    <span
                      className={`shrink-0 transition-colors ${
                        isSelected ? 'text-[#0891B2]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  {option.riskLevel && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${RISK_DOT_COLORS[option.riskLevel]}`}
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate flex items-center gap-2">
                      <span className="font-semibold" title={option.label}>{option.label}</span>
                      {option.badge && <span className="shrink-0">{option.badge}</span>}
                    </div>
                    {option.sublabel && (
                      <p
                        className={`text-[11px] truncate mt-0.5 leading-tight ${
                          effectiveDarkRoom
                            ? 'text-slate-400 group-hover:text-slate-300'
                            : 'text-slate-500 group-hover:text-slate-600'
                        }`}
                      >
                        {option.sublabel}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check
                    className={`shrink-0 ml-2 ${sizeStyles.icon} ${
                      effectiveDarkRoom ? 'text-cyan-400' : 'text-[#0891B2]'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Helper text or Error message */}
      {helperText && !error && (
        <p
          className={`text-[11px] mt-1.5 ${
            effectiveDarkRoom ? 'text-slate-400' : 'text-clinical-text-muted'
          }`}
        >
          {helperText}
        </p>
      )}
      {error && (
        <p
          className="text-[11px] mt-1.5 text-red-600 font-semibold flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
