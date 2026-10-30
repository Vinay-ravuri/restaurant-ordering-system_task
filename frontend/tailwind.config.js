/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8F6F1',
        foreground: '#20211F',
        cream: '#FFFDF9',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#20211F',
        },
        primary: {
          DEFAULT: '#E85D24', // Signature Burnt Orange from reference image
          hover: '#D24E18',
          foreground: '#FFFFFF',
          light: '#FDF1EB',
        },
        secondary: {
          DEFAULT: '#F0ECE3',
          hover: '#E5DFC0',
          foreground: '#20211F',
        },
        accent: {
          DEFAULT: '#E85D24',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#6B6964',
          foreground: '#8E8B85',
          background: '#F0ECE4',
        },
        border: '#E8E4DB',
        sage: {
          DEFAULT: '#82947B',
          light: '#EAF0E8',
          dark: '#586653',
        },
        dark: {
          bg: '#14161B',
          card: '#1F222A',
          border: '#2C303B',
          muted: '#8A91A0',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          foreground: '#FFFFFF',
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
        'soft': '0 2px 8px rgba(32, 33, 31, 0.04), 0 1px 2px rgba(32, 33, 31, 0.02)',
        'card': '0 4px 20px -2px rgba(32, 33, 31, 0.06), 0 2px 6px -1px rgba(32, 33, 31, 0.03)',
        'elevated': '0 12px 32px -4px rgba(32, 33, 31, 0.10), 0 4px 12px -2px rgba(32, 33, 31, 0.04)',
      },
    },
  },
  plugins: [],
};
