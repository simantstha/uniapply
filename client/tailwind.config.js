/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        heading: ['Fraunces', 'serif'],
      },
      colors: {
        brand: {
          terracotta: '#C4622D',
          'terracotta-hover': '#AD5225',
          gold: '#D4A843',
          navy: '#1E2D40',
          cream: '#F7F5F2',
          stone: '#6B5F54',
          warm: {
            50: '#F7F5F2',
            100: '#EFECE8',
            200: '#DDD8D0',
            300: '#C9C0B5',
            400: '#A89D93',
            500: '#6B5F54',
            600: '#4A3F36',
            700: '#2E2318',
            800: '#1E1A12',
            900: '#131008',
          },
        },
        // keep apple colors for status indicators (green/red/orange/purple)
        apple: {
          blue: '#0071E3',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9F0A',
          purple: '#BF5AF2',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(26,20,16,0.07), 0 1px 2px rgba(26,20,16,0.05)',
        'apple': '0 4px 16px rgba(26,20,16,0.08), 0 1px 4px rgba(26,20,16,0.05)',
        'apple-lg': '0 8px 32px rgba(26,20,16,0.12), 0 2px 8px rgba(26,20,16,0.07)',
        'apple-dark': '0 4px 16px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
        'warm': '0 4px 24px rgba(196,98,45,0.12), 0 1px 4px rgba(196,98,45,0.08)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
};
