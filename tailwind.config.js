/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070a14',
          900: '#0c1222',
          850: '#101830',
          800: '#162040',
          700: '#1e2c56',
        },
        brand: {
          purple: '#8b5cf6',
          indigo: '#6366f1',
          violet: '#7c3aed',
          pink: '#ec4899',
        }
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0, rgba(12, 18, 34, 0) 70%)',
      }
    },
  },
  plugins: [],
};
