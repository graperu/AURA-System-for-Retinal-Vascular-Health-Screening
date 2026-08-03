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
        primary: {
          DEFAULT: '#0891B2',
          light: '#22D3EE',
          dark: '#0E7490',
          50: '#F0FDFA',
          100: '#CCFBF1',
          700: '#0F766E',
          900: '#134E4A',
        },
        health: {
          DEFAULT: '#16A34A',
          light: '#4ADE80',
          dark: '#15803D',
        },
        medical: {
          bg: '#F0FDFA',
          card: '#FFFFFF',
          text: '#134E4A',
          muted: '#64748B',
          border: '#CCFBF1',
        },
        risk: {
          low: '#16A34A',
          moderate: '#EAB308',
          high: '#F97316',
          severe: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      boxShadow: {
        'medical-sm': '0 1px 3px rgba(8, 145, 178, 0.08), 0 1px 2px rgba(8, 145, 178, 0.04)',
        'medical-md': '0 4px 12px rgba(8, 145, 178, 0.1), 0 2px 4px rgba(8, 145, 178, 0.06)',
        'medical-lg': '0 10px 25px rgba(8, 145, 178, 0.12), 0 4px 10px rgba(8, 145, 178, 0.08)',
      }
    },
  },
  plugins: [],
}
