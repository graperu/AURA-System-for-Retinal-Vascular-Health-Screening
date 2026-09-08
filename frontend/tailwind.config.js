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
          severe: '#DC2626',
          'critical-bg': '#FEF2F2',
          'critical-border': '#FECACA',
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
        'medical-sm': '0 2px 8px -2px rgba(8, 145, 178, 0.08)',
        'medical-card': '0 4px 20px -4px rgba(7, 13, 45, 0.06)',
        'medical-modal': '0 20px 60px rgba(7, 13, 45, 0.25)',
      },
      borderRadius: {
        'medical-sm': '10px',
        'medical': '16px',
        'medical-lg': '24px',
      }
    },
  },
  plugins: [],
}
