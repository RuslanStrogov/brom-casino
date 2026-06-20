import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        casino: {
          dark: '#0a0a0f',
          darker: '#06060a',
          card: '#12121a',
          border: '#1e1e2e',
          gold: '#d4a843',
          'gold-light': '#f0d060',
          'gold-dark': '#a07828',
          accent: '#c9a84c',
          green: '#22c55e',
          red: '#ef4444',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4a843 0%, #f0d060 50%, #d4a843 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
        'gradient-card': 'linear-gradient(145deg, #12121a 0%, #0a0a0f 100%)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px #d4a843, 0 0 10px #d4a843' },
          '100%': { boxShadow: '0 0 20px #d4a843, 0 0 30px #d4a843' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
