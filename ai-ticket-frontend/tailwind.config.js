// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   darkMode: 'class',
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           50: '#eff6ff',
//           100: '#dbeafe',
//           200: '#bfdbfe',
//           300: '#93c5fd',
//           400: '#60a5fa',
//           500: '#3b82f6',
//           600: '#2563eb',
//           700: '#1d4ed8',
//           800: '#1e40af',
//           900: '#1e3a8a',
//           950: '#172554',
//         },
//         gray: {
//           50: '#f9fafb',
//           100: '#f3f4f6',
//           200: '#e5e7eb',
//           300: '#d1d5db',
//           400: '#9ca3af',
//           500: '#6b7280',
//           600: '#4b5563',
//           700: '#374151',
//           800: '#1f2937',
//           900: '#111827',
//           950: '#030712',
//         },
//         success: {
//           50: '#f0fdf4',
//           100: '#dcfce7',
//           200: '#bbf7d0',
//           300: '#86efac',
//           400: '#4ade80',
//           500: '#22c55e',
//           600: '#16a34a',
//           700: '#15803d',
//           800: '#166534',
//           900: '#14532d',
//           950: '#052e16',
//         },
//         warning: {
//           50: '#fffbeb',
//           100: '#fef3c7',
//           200: '#fde68a',
//           300: '#fcd34d',
//           400: '#fbbf24',
//           500: '#f59e0b',
//           600: '#d97706',
//           700: '#b45309',
//           800: '#92400e',
//           900: '#78350f',
//           950: '#451a03',
//         },
//         danger: {
//           50: '#fef2f2',
//           100: '#fee2e2',
//           200: '#fecaca',
//           300: '#fca5a5',
//           400: '#f87171',
//           500: '#ef4444',
//           600: '#dc2626',
//           700: '#b91c1c',
//           800: '#991b1b',
//           900: '#7f1d1d',
//           950: '#450a0a',
//         }
//       },
//       fontFamily: {
//         sans: ['Inter', 'system-ui', 'sans-serif'],
//         mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
//       },
//       fontSize: {
//         'xs': ['0.75rem', { lineHeight: '1rem' }],
//         'sm': ['0.875rem', { lineHeight: '1.25rem' }],
//         'base': ['1rem', { lineHeight: '1.5rem' }],
//         'lg': ['1.125rem', { lineHeight: '1.75rem' }],
//         'xl': ['1.25rem', { lineHeight: '1.75rem' }],
//         '2xl': ['1.5rem', { lineHeight: '2rem' }],
//         '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
//         '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
//         '5xl': ['3rem', { lineHeight: '1' }],
//         '6xl': ['3.75rem', { lineHeight: '1' }],
//       },
//       spacing: {
//         '18': '4.5rem',
//         '88': '22rem',
//         '128': '32rem',
//       },
//       animation: {
//         'fade-in': 'fadeIn 0.5s ease-in-out',
//         'fade-out': 'fadeOut 0.5s ease-in-out',
//         'slide-in-right': 'slideInRight 0.3s ease-out',
//         'slide-in-left': 'slideInLeft 0.3s ease-out',
//         'slide-up': 'slideUp 0.3s ease-out',
//         'bounce-in': 'bounceIn 0.6s ease-out',
//         'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//         'shimmer': 'shimmer 2s linear infinite',
//       },
//       keyframes: {
//         fadeIn: {
//           '0%': { opacity: '0' },
//           '100%': { opacity: '1' },
//         },
//         fadeOut: {
//           '0%': { opacity: '1' },
//           '100%': { opacity: '0' },
//         },
//         slideInRight: {
//           '0%': { transform: 'translateX(100%)', opacity: '0' },
//           '100%': { transform: 'translateX(0)', opacity: '1' },
//         },
//         slideInLeft: {
//           '0%': { transform: 'translateX(-100%)', opacity: '0' },
//           '100%': { transform: 'translateX(0)', opacity: '1' },
//         },
//         slideUp: {
//           '0%': { transform: 'translateY(100%)', opacity: '0' },
//           '100%': { transform: 'translateY(0)', opacity: '1' },
//         },
//         bounceIn: {
//           '0%': { transform: 'scale(0.3)', opacity: '0' },
//           '50%': { transform: 'scale(1.05)' },
//           '70%': { transform: 'scale(0.9)' },
//           '100%': { transform: 'scale(1)', opacity: '1' },
//         },
//         pulseSoft: {
//           '0%, 100%': { opacity: '1' },
//           '50%': { opacity: '0.7' },
//         },
//         shimmer: {
//           '0%': { backgroundPosition: '-200px 0' },
//           '100%': { backgroundPosition: '200px 0' },
//         },
//       },
//       backdropBlur: {
//         xs: '2px',
//       },
//       boxShadow: {
//         'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
//         'medium': '0 4px 25px 0 rgba(0, 0, 0, 0.15)',
//         'hard': '0 8px 30px 0 rgba(0, 0, 0, 0.25)',
//         'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
//       },
//       borderRadius: {
//         'xl': '0.75rem',
//         '2xl': '1rem',
//         '3xl': '1.5rem',
//       },
//     },
//   },
//   plugins: [
//     require('@tailwindcss/forms')({
//       strategy: 'class',
//     }),
//     require('@tailwindcss/typography'),
//     require('@tailwindcss/aspect-ratio'),
//   ],
// }


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
