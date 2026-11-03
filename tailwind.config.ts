import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        overlay: 'var(--color-overlay)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        input: 'var(--color-border)',
        ring: 'var(--color-primary)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          foreground: 'var(--color-surface)',
          text: 'var(--color-primary-text)',
        },
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-neutral': 'var(--color-text-neutral)',
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          tint: 'var(--color-success-tint)',
          dark: 'var(--color-success-dark)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          tint: 'var(--color-warning-tint)',
          dark: 'var(--color-warning-dark)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          tint: 'var(--color-error-tint)',
          dark: 'var(--color-error-dark)',
        },
        neutral: {
          DEFAULT: 'var(--color-text-neutral)',
          tint: 'var(--color-neutral-tint)',
          dark: 'var(--color-neutral-dark)',
        },
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-text-secondary)',
        },
      },
      fontFamily: {
        display: ['var(--font-general-sans)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        tag: 'var(--radius-tag)', // 4px
        btn: 'var(--radius-btn)', // 6px
        panel: 'var(--radius-panel)', // 8px
        card: 'var(--radius-card)', // 12px
        full: 'var(--radius-full)', // 9999px
      },
      boxShadow: {
        'card-hover': 'var(--shadow-card-hover)',
        'primary-glow': 'var(--shadow-primary-glow)',
        'focus-ring': 'var(--shadow-focus-ring)',
      },
      spacing: {
        13: '3.25rem',
        14: '3.5rem',
      },
      maxWidth: {
        container: '1280px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

