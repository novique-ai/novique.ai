import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy light-theme brand colors (used by existing light pages — keep).
        primary: {
          50: '#e0f7fa',
          100: '#b2ebf2',
          200: '#80deea',
          300: '#4dd0e1',
          400: '#26c6da',
          500: '#1e90ff',
          600: '#4169e1',
          700: '#0277bd',
          800: '#01579b',
          900: '#001f3f',
        },
        secondary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        accent: {
          light: '#a0d8ef',
          DEFAULT: '#1e90ff',
          dark: '#4169e1',
        },

        // --- Novique dark redesign tokens (resolve inside .theme-dark) ---
        surface: {
          0: 'var(--bg-0)',
          1: 'var(--bg-1)',
          2: 'var(--bg-2)',
          3: 'var(--bg-3)',
          chrome: 'var(--bg-chrome)',
        },
        ink: {
          0: 'var(--ink-0)',
          1: 'var(--ink-1)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        stroke: {
          0: 'var(--border-0)',
          1: 'var(--border-1)',
          2: 'var(--border-2)',
          accent: 'var(--border-accent)',
        },
        aqua: {
          DEFAULT: 'var(--accent)',
          bright: 'var(--accent-2)',
          deep: 'var(--accent-deep)',
          secondary: 'var(--accent-secondary)',
        },
        link: {
          DEFAULT: 'var(--link)',
          hover: 'var(--link-hover)',
        },
        signal: {
          success: 'var(--success)',
          warning: 'var(--warning)',
          danger: 'var(--danger)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', "'SF Mono'", "'JetBrains Mono'", "'Cascadia Code'", 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3.25rem, 2.4rem + 4.2vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display': ['clamp(2.75rem, 2.1rem + 3.2vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'dh1': ['clamp(2.25rem, 1.8rem + 2.2vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'dh2': ['clamp(1.75rem, 1.5rem + 1.2vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'dh3': ['clamp(1.375rem, 1.25rem + 0.6vw, 1.625rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'body-lg': ['clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)', { lineHeight: '1.6' }],
        'overline': ['0.75rem', { lineHeight: '1', letterSpacing: '0.12em' }],
      },
      maxWidth: {
        container: '1200px',
        reading: '68ch',
      },
      boxShadow: {
        'elev-1': 'var(--elev-1)',
        'elev-2': 'var(--elev-2)',
        'elev-3': 'var(--elev-3)',
        'glow': 'var(--glow-accent)',
        'glow-strong': 'var(--glow-accent-strong)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'accent-grad': 'var(--accent-grad)',
        'accent-orb': 'var(--accent-orb)',
      },
      transitionTimingFunction: {
        'out-snap': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-smooth': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
        graphic: '600ms',
      },
      typography: {
        DEFAULT: {
          css: {
            'li': { marginTop: '0.25em', marginBottom: '0.25em' },
            'ul': { marginTop: '0.5em', marginBottom: '0.5em' },
            'ol': { marginTop: '0.5em', marginBottom: '0.5em' },
          },
        },
        lg: {
          css: {
            'li': { marginTop: '0.25em', marginBottom: '0.25em' },
            'ul': { marginTop: '0.5em', marginBottom: '0.5em' },
            'ol': { marginTop: '0.5em', marginBottom: '0.5em' },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
