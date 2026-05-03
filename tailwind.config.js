/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10B981', // Emerald 500
          dark: '#059669',
          light: '#34D399',
        },
        secondary: {
          DEFAULT: '#0F172A', // Slate 900
          dark: '#020617',
          light: '#1E293B',
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber 500
          dark: '#D97706',
          light: '#FBBF24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
