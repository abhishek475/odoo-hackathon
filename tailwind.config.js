/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#09090b',
          subtle: '#121215',
          elevated: '#18181b',
          muted: '#27272a',
          border: '#27272a',
        },
        cyanAccent: {
          DEFAULT: '#67e8f9',
          hover: '#a5f3fc',
          muted: '#164e63',
        }
      }
    },
  },
  plugins: [],
}
