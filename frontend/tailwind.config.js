/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0B0F17',
          card: '#121824',
          border: '#1F293D',
          muted: '#8A99AD',
          emerald: '#10B981',
          rose: '#F43F5E',
          blue: '#3B82F6',
          amber: '#F59E0B',
        }
      }
    },
  },
  plugins: [],
}

