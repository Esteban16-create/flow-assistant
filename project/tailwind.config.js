/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: 'rgb(55 65 81)', // text-gray-700
            '[class~="dark"] &': {
              color: 'rgb(229 231 235)', // text-gray-200
            },
          },
        },
      },
    },
  },
  plugins: [],
};