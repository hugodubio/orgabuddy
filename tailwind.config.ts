import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        bg:      'var(--bg)',
        surface: 'var(--surface)',
        border:  'var(--border)',
        amber:   'var(--amber)',
      },
    },
  },
  plugins: [],
} satisfies Config
