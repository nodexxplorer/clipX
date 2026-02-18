/** Tailwind config for the project. Keep this minimal and extend in `theme.extend` as needed. */
/** See https://tailwindcss.com/docs/configuration */

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // keep a few defaults used by the app (structured for Tailwind's color utilities)
        dark: {
          100: '#0b0f14',
          200: '#0f1720',
          300: '#050607'
        },
        primary: {
          500: '#06b6d4',
          600: '#0891b2'
        }
      }
    }
  },
  plugins: [],
};