// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ajuste conforme sua estrutura de pastas
  ],
  theme: {
    extend: {
      // ADICIONE ISTO AQUI 👇
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
      animation: {
        wiggle: 'wiggle 0.3s ease-in-out infinite',
      }
      // ☝️ ATÉ AQUI
    },
  },
  plugins: [],
}