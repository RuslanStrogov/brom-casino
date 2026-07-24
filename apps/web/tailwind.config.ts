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
          darker: '#050508',
          card: '#0f0f1a',
          card2: '#141420',
          border: '#1e1e2e',
          gold: '#d4a843',
          'gold-light': '#f0d060',
          'gold-dark': '#a07828',
          accent: '#c9a84c',
          green: '#22c55e',
          red: '#ef4444',
          muted: '#6b7280',
        },
        miami: {
          pink: '#ff2d95',
          cyan: '#00d4ff',
          purple: '#b44aff',
          orange: '#ff6b35',
          sunset: '#ff4d6d',
          sky: '#0a1628',
          neon: '#39ff14',
        },
      },
      fontFamily: {
        sans: ['var(--font-onest)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-unbounded)', 'system-ui', 'sans-serif'],
        display: ['var(--font-unbounded)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #d4a843 0%, #f0d060 50%, #d4a843 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
        'gradient-card': 'linear-gradient(145deg, #12121a 0%, #0a0a0f 100%)',
        'gradient-miami': 'linear-gradient(135deg, #ff2d95 0%, #b44aff 50%, #00d4ff 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #ff4d6d 0%, #ff6b35 50%, #ffd60a 100%)',
        'gradient-neon': 'linear-gradient(90deg, #00d4ff, #b44aff, #ff2d95)',
        'gradient-hero': 'linear-gradient(180deg, #0a0a0f 0%, rgba(10,22,40,0.8) 50%, #0a0a0f 100%)',
        'gradient-radial': 'radial-gradient(ellipse at center, rgba(180,74,255,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'neon-pink': '0 0 10px rgba(255,45,149,0.3), 0 0 20px rgba(255,45,149,0.1)',
        'neon-cyan': '0 0 10px rgba(0,212,255,0.3), 0 0 20px rgba(0,212,255,0.1)',
        'neon-purple': '0 0 10px rgba(180,74,255,0.3), 0 0 20px rgba(180,74,255,0.1)',
        'neon-gold': '0 0 10px rgba(212,168,67,0.3), 0 0 20px rgba(212,168,67,0.1)',
        'glow-lg': '0 0 30px rgba(180,74,255,0.2), 0 0 60px rgba(180,74,255,0.1)',
        'glow-pink': '0 0 30px rgba(255,45,149,0.2), 0 0 60px rgba(255,45,149,0.1)',
        'card-miami': '0 4px 30px rgba(0,0,0,0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-pulse-fast': 'neon-pulse 1s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'sunset-float': 'sunset-float 6s ease-in-out infinite',
        'palm-sway': 'palm-sway 4s ease-in-out infinite',
        'shimmer-miami': 'shimmer-miami 3s linear infinite',
        'fade-up': 'fade-up 0.6s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'glitch': 'glitch 3s infinite',
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
        'neon-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'sunset-float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(-2deg)' },
          '50%': { transform: 'translateY(-15px) rotate(2deg)' },
        },
        'palm-sway': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'shimmer-miami': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, -2px)' },
          '80%': { transform: 'translate(1px, 1px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;