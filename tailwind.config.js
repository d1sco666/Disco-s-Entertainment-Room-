/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        netflix: {
          black: '#0a0a0a',
          dark: '#141414',
          red: '#e50914',
          'red-hover': '#f40612',
          gray: '#333',
        },
        // Add support for text-dark-100 and other dark-* utilities
        dark: {
          100: '#f4f4f4',
          200: '#e4e4e4',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#151515',
        },
      },
    },
  },
  plugins: [],
}
