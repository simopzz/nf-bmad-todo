/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js,tsx,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#006C4A',
        },
        'primary-container': '#1E293B',
        secondary: '#006C4A',
        surface: '#F7F9FB',
        'surface-low': '#F2F4F6',
        'surface-lowest': '#FFFFFF',
        'surface-highest': '#E2E8F0',
        'outline-variant': '#64748B',
        'on-surface': '#1E293B',
        'on-surface-variant': '#64748B',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
