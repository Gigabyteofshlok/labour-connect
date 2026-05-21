/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8eb',
          100: '#fdeed0',
          200: '#fbd8a0',
          300: '#f8bd6c',
          400: '#f49a3c',
          500: '#eb791a', // Prime construction orange/gold
          600: '#d75d10',
          700: '#b2440f',
          800: '#8e3512',
          900: '#752d12',
        },
        dark: {
          50: '#f6f6f7',
          100: '#e1e1e6',
          200: '#c2c2ce',
          300: '#9b9baa',
          400: '#737387',
          500: '#5a5a6e',
          600: '#434354',
          700: '#2b2b37',
          800: '#181820', // Jet dark accent
          900: '#0f0f15', // Pure deep dark background
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
        'orange-gradient': 'linear-gradient(135deg, #eb791a 0%, #b2440f 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-subtle': '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
