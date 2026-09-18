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
        // AURA Brand & Primary Palette (MediRoom Clinical Blue)
        brand: {
          50: '#EEF5FF',   // Soft blue background
          100: '#E0EAFF',  // Subtle tint
          200: '#C7D7FE',  // Light border / accent
          300: '#93B4FA',  // Interactive secondary
          400: '#6090F7',  // Focus ring / hover
          500: '#3478F6',  // Primary MediRoom Blue
          600: '#2563EB',  // Primary Hover Blue
          700: '#1D4ED8',  // Darker pressed Blue
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3478F6',
        },
        primary: {
          DEFAULT: '#3478F6',
          hover: '#2563EB',
          dark: '#1D4ED8',
          light: '#6090F7',
          soft: '#EEF5FF',
          50: '#EEF5FF',
          100: '#E0EAFF',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        // Clinical Surface & Border Tokens (MediRoom Standard)
        clinical: {
          bg: '#F5F6F8',           // Canvas background
          surface: '#FFFFFF',      // Card & panel surface
          'surface-subtle': '#F8F9FA', // Table headers & subtle panels
          'surface-hover': '#F9FAFB',  // Table row & list hover
          'surface-strong': '#EEF2F6',
          border: '#EAECF0',       // Hairline border
          'border-subtle': '#E8EBEF', // Inner dividers
          'border-strong': '#D0D5DD',
          text: '#111827',         // Primary text
          'text-secondary': '#667085', // Secondary clinical text
          'text-muted': '#98A2B3', // Muted timestamps & helpers
        },
        // Standardized Clinical Status & Badge Tokens
        badge: {
          'success-text': '#22C55E',
          'success-bg': '#ECFDF3',
          'warning-text': '#F59E0B',
          'warning-bg': '#FFFAEB',
          'danger-text': '#EF4444',
          'danger-bg': '#FEF3F2',
          'info-text': '#0EA5E9',
          'info-bg': '#EEF5FF',
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
        sans: [
          'Inter',
          '"Plus Jakarta Sans"',
          '"Be Vietnam Pro"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        heading: [
          'Inter',
          '"Plus Jakarta Sans"',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"Fira Code"', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        normal: '0.01em',
        wide: '0.025em',
      },
      boxShadow: {
        'medical-xs': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
        'medical-sm': '0 1px 3px 0 rgba(16, 24, 40, 0.08), 0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'medical-md': '0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.04)',
        'medical-card': '0 1px 3px 0 rgba(16, 24, 40, 0.05)',
        'medical-modal': '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 10px 10px -5px rgba(16, 24, 40, 0.04)',
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
