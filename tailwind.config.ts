import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'qc-bg-primary': 'var(--bg-primary)',
        'qc-bg-secondary': 'var(--bg-secondary)',
        'qc-bg-card': 'var(--bg-card)',
        'qc-bg-card-hover': 'var(--bg-card-hover)',
        'qc-bg-input': 'var(--bg-input)',
        'qc-border': 'var(--border)',
        'qc-border-light': 'var(--border-light)',
        'qc-text-primary': 'var(--text-primary)',
        'qc-text-secondary': 'var(--text-secondary)',
        'qc-text-muted': 'var(--text-muted)',
        'qc-accent': 'var(--accent)',
        'qc-blue': 'var(--blue)',
        'qc-orange': 'var(--orange)',
        'qc-red': 'var(--red)',
        'qc-green': 'var(--green)',
        'qc-purple': 'var(--purple)',
        'qc-cyan': 'var(--cyan)',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        sans: ['var(--font-sans)', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'qc': 'var(--radius)',
        'qc-sm': 'var(--radius-sm)',
      },
    },
  },
  plugins: [],
};

export default config;
