/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        adenine: '#8AD1E3',
        thymine: '#B296FF',
        cytosine: '#B6E388',
        guanine: '#F9A23B',
        strand: '#E24B6A',
      },
    },
  },
  plugins: [],
}


