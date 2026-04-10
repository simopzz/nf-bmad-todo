/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js,tsx,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#c6c6c6',
        'primary-container': '#1A1F2D',
        'on-primary-container': '#DFE5FC',
        secondary: '#c6c6c6',
        surface: '#0c0e14',
        'surface-low': '#10131b',
        'surface-lowest': '#000000',
        'surface-highest': '#1a1f2d',
        'surface-bright': '#242c3f',
        'surface-dim': '#080a11',
        'outline-variant': '#41485a',
        'on-surface': '#dfe5fc',
        'on-surface-variant': '#a5aac0',
        'on-tertiary-fixed-variant': '#6b7289',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
