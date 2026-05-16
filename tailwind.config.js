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
          DEFAULT: 'rgb(var(--color-primary, 223 255 94) / <alpha-value>)', // Lime Neon
          dark: 'var(--color-primary-dark, #B8E600)',
          light: 'var(--color-primary-light, #E9FF8A)',
        },
        secondary: {
          DEFAULT: '#000000', // Deep Black
          dark: '#050505',
          light: '#111111',
        },
        accent: {
          DEFAULT: '#C6C4FF', // Lavender
          dark: '#9B98FF',
          light: '#E2E1FF',
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
