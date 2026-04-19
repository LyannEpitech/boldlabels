/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand - Indigo
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          raised:   '#F8FAFC',
          sunken:   '#F1F5F9',
          overlay:  'rgba(255, 255, 255, 0.8)',
        },
        // Text
        text: {
          primary:   '#0F172A',
          secondary: '#475569',
          muted:     '#94A3B8',
          inverse:   '#FFFFFF',
        },
        // Border
        border: {
          DEFAULT: '#E2E8F0',
          hover:   '#CBD5E1',
        },
        // Semantic
        success: { 
          light: '#DCFCE7', 
          DEFAULT: '#16A34A', 
          dark: '#15803D' 
        },
        warning: { 
          light: '#FEF3C7', 
          DEFAULT: '#D97706', 
          dark: '#B45309' 
        },
        danger:  { 
          light: '#FEE2E2', 
          DEFAULT: '#DC2626', 
          dark: '#B91C1C' 
        },
        info:    { 
          light: '#DBEAFE', 
          DEFAULT: '#2563EB', 
          dark: '#1D4ED8' 
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs':  ['0.75rem',  { lineHeight: '1rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'xs':    '0 1px 2px rgba(0,0,0,0.04)',
        'sm':    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 2px 8px rgba(0,0,0,0.08)',
        'md':    '0 4px 12px rgba(0,0,0,0.08)',
        'lg':    '0 8px 24px rgba(0,0,0,0.12)',
        'glow':  '0 0 20px rgba(99,102,241,0.15)',
      },
      spacing: {
        '4.5': '1.125rem',
        '18':  '4.5rem',
      },
    },
  },
  plugins: [],
};
