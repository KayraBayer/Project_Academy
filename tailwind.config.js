/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2f80ed',
        'primary-soft': '#dbeafe',
        'primary-muted': '#93c5fd',
        secondary: '#0060ac',
        'secondary-soft': '#d4e3ff',
        tertiary: '#006c4b',
        'tertiary-soft': '#d8f8e8',
        rose: '#d9468f',
        'rose-soft': '#ffe2ef',
        amber: '#d97706',
        'amber-soft': '#fff0d4',
        surface: '#f8f9fa',
        'surface-low': '#f3f4f5',
        'surface-card': '#ffffff',
        'surface-border': '#e1e3e4',
        ink: '#191c1d',
        muted: '#61616b',
        outline: '#7a7583',
        danger: '#ba1a1a',
        'danger-soft': '#ffdad6',
        'dark-bg': '#171820',
        'dark-surface': '#20212b',
        'dark-card': '#292a36',
        'dark-border': '#3a3b48',
        'dark-muted': '#b9bac7',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px -22px rgba(47, 128, 237, 0.34)',
        card: '0 12px 32px -20px rgba(25, 28, 29, 0.28)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
