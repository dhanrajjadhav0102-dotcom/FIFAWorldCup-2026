/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fifa: {
          burgundy: "#8A1538",
          burgundyDark: "#5c0e25",
          burgundyLight: "#a61b45",
          gold: "#A98A48",
          goldDark: "#856b35",
          goldLight: "#c7ab6b",
          dark: "#0B0F19",
          cardDark: "#151B2C",
          emerald: "#10B981",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
