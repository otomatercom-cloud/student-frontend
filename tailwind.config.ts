import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#ecfaf3', 100: '#d1f3e2', 200: '#a3e6c6', 300: '#6fd3a5', 400: '#34b97f', 500: '#14a06f', 600: '#0f8a5f', 700: '#0b6b4a', 800: '#0a553c', 900: '#083f2d' },
      },
      boxShadow: { card: '0 1px 2px rgba(16,60,44,.05), 0 6px 20px rgba(16,60,44,.06)' },
    },
  },
  plugins: [],
};
export default config;
