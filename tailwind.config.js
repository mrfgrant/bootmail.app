/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // BootMail brand palette
        olive:   { DEFAULT: '#4a5240', light: '#6b7560', dark: '#363d2f' },
        tan:     { DEFAULT: '#c8b89a', light: '#e8ddd0', dark: '#a89878' },
        cream:   { DEFAULT: '#f5f0e8', dark: '#ede5d8' },
        gold:    { DEFAULT: '#b8860b', light: '#d4a017', dark: '#8a6408' },
        army:    { DEFAULT: '#4b5320' },
        marine:  { DEFAULT: '#cc0000' },
        navy:    { DEFAULT: '#000080' },
        airforce:{ DEFAULT: '#00308f' },
        cg:      { DEFAULT: '#003087' },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'pulse-slow':'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
