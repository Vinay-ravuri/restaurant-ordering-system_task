/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8F6F1',
        foreground: '#20211F',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#20211F',
        },
        primary: {
          DEFAULT: '#C65D3B', // Terracotta / burnt orange
          hover: '#B55030',
          foreground: '#FFFFFF',
          light: '#FBECE7',
        },
        secondary: {
          DEFAULT: '#ECE8DF',
          hover: '#DFD9CD',
          foreground: '#20211F',
        },
        accent: {
          DEFAULT: '#F97316',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#6B6964',
          foreground: '#8E8B85',
          background: '#F0ECE4',
        },
        border: '#E4DFD5',
        success: {
          DEFAULT: '#2E7D32',
          light: '#E8F5E9',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FEF3C7',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
          foreground: '#FFFFFF',
        },
        sage: {
          50: '#F4F6F4',
          100: '#E6EAE5',
          500: '#5A7363',
          700: '#3D5043',
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(32, 33, 31, 0.04), 0 1px 3px rgba(32, 33, 31, 0.02)',
        'card': '0 4px 20px -2px rgba(32, 33, 31, 0.06), 0 2px 6px -1px rgba(32, 33, 31, 0.03)',
        'elevated': '0 12px 32px -4px rgba(32, 33, 31, 0.12), 0 4px 12px -2px rgba(32, 33, 31, 0.06)',
      },
    },
  },
  plugins: [],
};
