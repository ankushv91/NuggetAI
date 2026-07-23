/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FBF9F5',
        mint: '#A7F3D0',
        pink: '#FBCFE8',
        yellow: '#FEF08A',
        blue: '#BAE6FD',
        violet: '#DDD6FE',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
