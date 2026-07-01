/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        senegal: { green: '#009639', yellow: '#FDEF42', red: '#E31B23' }
      }
    }
  },
  plugins: []
}
