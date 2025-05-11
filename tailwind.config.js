/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/index.html',
  ],
  theme: {
    extend: {
      colors: {
        'bet-dark': {
          950: '#050505',
          900: '#111111',
          800: '#1E1E1E',
          700: '#2D2D2D',
          600: '#3D3D3D',
          500: '#505050',
        },
        'bet-green': {
          500: '#00EFB2',
          400: '#34F5C5',
          300: '#66FACD',
        },
        'bet-gray': {
          100: '#F2F2F2',
          200: '#E0E0E0',
          300: '#BDBDBD',
        },
        'outcome': {
          'white': '#E0E0E0',
          'black': '#111111',
          'draw': '#505050',
        }
      },
      boxShadow: {
        'neumorphic-inset': 'inset 5px 5px 10px rgba(0, 0, 0, 0.5), inset -5px -5px 10px rgba(255, 255, 255, 0.05)',
        'neumorphic': '5px 5px 10px rgba(0, 0, 0, 0.5), -5px -5px 10px rgba(255, 255, 255, 0.05)',
        'bet-green': '0 0 15px 2px rgba(0, 239, 178, 0.5)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      gridTemplateColumns: {
        'game': '3fr 2fr',
      },
    },
  },
  plugins: [],
}