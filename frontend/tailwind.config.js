/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft':       '0 4px 20px -2px rgba(79, 70, 229, 0.1)',
        'soft-hover': '0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.1)',
        'btn':        '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
        'btn-hover':  '0 6px 20px 0 rgba(79, 70, 229, 0.4)',
        'glow':       '0 0 20px rgba(79, 70, 229, 0.5)',
        'modal':      '0 20px 60px -10px rgba(79, 70, 229, 0.2)',
      },
    },
  },
  plugins: [],
}
