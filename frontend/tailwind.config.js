/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Brand Colors ─────────────────────────────────────
      colors: {
        saffron: {
          DEFAULT: '#E65100',
          50:  '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100', // Primary brand saffron
        },
        gold: {
          DEFAULT: '#F9A825',
          50:  '#FFFDE7',
          100: '#FFF9C4',
          200: '#FFF59D',
          300: '#FFF176',
          400: '#FFEE58',
          500: '#FFEB3B',
          600: '#FDD835',
          700: '#FBC02D',
          800: '#F9A825', // Accent gold
          900: '#F57F17',
        },
        leaf: {
          DEFAULT: '#388E3C',
          light: '#66BB6A',
          dark:  '#2E7D32',
        },
        cream:   '#FFFDF5',
        ivory:   '#FFF8F0',
        espresso:'#2C1810',
        warm: {
          50:  '#FFFDF5',
          100: '#FFF8F0',
          200: '#FFF0E0',
          300: '#FFE4C4',
          400: '#FFD4A0',
          500: '#FFC07C',
        },
      },

      // ── Typography ────────────────────────────────────────
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },

      // ── Spacing & Sizing ──────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },

      // ── Shadows ───────────────────────────────────────────
      boxShadow: {
        'warm-sm': '0 1px 3px 0 rgba(44, 24, 16, 0.1)',
        'warm':    '0 4px 12px 0 rgba(44, 24, 16, 0.12)',
        'warm-lg': '0 10px 30px 0 rgba(44, 24, 16, 0.15)',
        'warm-xl': '0 20px 40px 0 rgba(230, 81, 0, 0.2)',
        'gold':    '0 0 0 3px rgba(249, 168, 37, 0.4)',
        'saffron': '0 0 0 3px rgba(230, 81, 0, 0.3)',
      },

      // ── Animations ────────────────────────────────────────
      keyframes: {
        'float-up': {
          '0%':   { transform: 'translateY(0) rotate(0deg)', opacity: '0.8' },
          '100%': { transform: 'translateY(-100vh) rotate(360deg)', opacity: '0' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':      { transform: 'translateY(-20px) rotate(15deg)' },
        },
        'bounce-cart': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%':      { transform: 'scale(1.3)' },
          '50%':      { transform: 'scale(0.9)' },
          '75%':      { transform: 'scale(1.1)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        'slide-in-up': {
          '0%':   { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',    opacity: '1' },
          '100%': { transform: 'scale(1.5)',  opacity: '0' },
        },
      },
      animation: {
        'float-up':       'float-up 8s ease-in infinite',
        'float-slow':     'float-slow 4s ease-in-out infinite',
        'bounce-cart':    'bounce-cart 0.5s ease-in-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-up':    'slide-in-up 0.4s ease-out',
        'fade-in':        'fade-in 0.3s ease-out',
        'shimmer':        'shimmer 1.5s infinite linear',
        'spin-slow':      'spin-slow 8s linear infinite',
        'pulse-ring':     'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
      },

      // ── Background Gradients ──────────────────────────────
      backgroundImage: {
        'hero-gradient':   'linear-gradient(135deg, #E65100 0%, #F9A825 50%, #FFFDF5 100%)',
        'card-gradient':   'linear-gradient(145deg, #FFF8F0 0%, #FFFDF5 100%)',
        'saffron-gradient':'linear-gradient(135deg, #E65100, #F57C00)',
        'gold-gradient':   'linear-gradient(135deg, #F9A825, #FDD835)',
        'shimmer-gradient':'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
