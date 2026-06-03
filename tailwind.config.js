module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        transilio: {
          // Couleurs principales
          blue: '#0F1459',
          red: '#FF5340',
          white: '#FFFFFF',
          // Couleurs secondaires
          black: '#000000',
          electric: '#2F3CED',
          'blue-light': '#F0F1FF',
          'red-dark': '#730B00',
          'red-light': '#FFEDEB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'classic': '0 2px 8px rgba(15, 20, 89, 0.08), 0 1px 3px rgba(15, 20, 89, 0.04)',
        'classic-hover': '0 4px 16px rgba(15, 20, 89, 0.12), 0 2px 6px rgba(15, 20, 89, 0.06)',
        'card': '0 1px 4px rgba(15, 20, 89, 0.06), 0 2px 8px rgba(15, 20, 89, 0.04)',
      },
      borderRadius: {
        'classic': '6px',
      },
    },
  },
  plugins: [],
}
