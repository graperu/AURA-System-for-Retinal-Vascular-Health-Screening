/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AURA Brand & Primary Palette (Medical Teal & Ocean Blue)
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0891B2', // Primary Brand Medical Blue
          700: '#0E7490', // Hover
          800: '#155E75',
          900: '#164E63',
          DEFAULT: '#0891B2',
        },
        primary: {
          DEFAULT: '#0891B2',
          light: '#22D3EE',
          dark: '#0E7490',
          50: '#F0FDFA',
          100: '#CCFBF1',
          700: '#0E7490',
          900: '#134E4A',
        },
        // Clinical Surface & Border Tokens
        clinical: {
          bg: '#F4F7FC',
          surface: '#FFFFFF',
          'surface-subtle': '#F8FAFC',
          'surface-strong': '#E8F1F6',
          border: '#E2E8F0',
          'border-subtle': '#F1F5F9',
          'border-strong': '#CBD5E1',
          text: '#0F172A',
          'text-secondary': '#334155',
          'text-muted': '#64748B',
        },
        // Standardized Clinical Risk Stratification
        risk: {
          low: '#16A34A',       // Green
          'low-bg': '#F0FDF4',
          'low-border': '#BBF7D0',
          moderate: '#D97706',  // Amber
          'moderate-bg': '#FFFBEB',
          'moderate-border': '#FDE68A',
          high: '#EA580C',      // Orange
          'high-bg': '#FFF7ED',
          'high-border': '#FFEDD5',
          critical: '#DC2626',  // Red
          'critical-bg': '#FEF2F2',
          'critical-border': '#FECACA',
          unverified: '#64748B',
          'unverified-bg': '#F8FAFC',
          'unverified-border': '#E2E8F0',
        },
        // Dark Room Ophthalmology Inspection Mode (Obsidian Deep Background)
        darkroom: {
          bg: '#030712',
          surface: '#0B132B',
          card: '#0F172A',
          border: '#1E293B',
          accent: '#38BDF8',
          text: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      letterSpacing: {
        normal: '0.01em',
        wide: '0.025em',
      },
      boxShadow: {
        'medical-xs': '0 1px 2px 0 rgba(7, 13, 45, 0.05)',
        'medical-sm': '0 2px 8px -2px rgba(7, 13, 45, 0.05)',
        'medical-md': '0 4px 14px 0 rgba(7, 13, 45, 0.08)',
        'medical-card': '0 4px 20px -4px rgba(7, 13, 45, 0.06)',
        'medical-modal': '0 20px 60px rgba(7, 13, 45, 0.25)',
      },
      borderRadius: {
        'medical-sm': '10px',
        'medical': '16px',
        'medical-lg': '24px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        dropdownEnter: {
          '0%': { opacity: '0', transform: 'scale(0.98) translateY(-6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        dropdownExit: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.98) translateY(-6px)' },
        },
        modalEnter: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        staggerFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'dropdown-enter': 'dropdownEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'dropdown-exit': 'dropdownExit 120ms cubic-bezier(0.4, 0, 1, 1) forwards',
        'modal-enter': 'modalEnter 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer': 'shimmer 2.2s infinite linear',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'stagger-fade': 'staggerFade 280ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      transitionTimingFunction: {
        'clinical': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'clinical-in': 'cubic-bezier(0.4, 0, 1, 1)',
      }
    },
  },
  plugins: [],
}
