/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#FFFFFF',
          canvas: '#F5F4F1',
          elevated: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1C1B18',
          muted: '#7A756D',
        },
        accent: {
          DEFAULT: '#7B5F43',
        },
        border: {
          DEFAULT: '#E6E2DC',
          light: '#EFECE7',
        },
        danger: '#C44A3A',
        warning: '#B8860B',
        success: '#5A7A5A',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '7': '48px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 4px rgba(28, 27, 24, 0.04)',
        elevated: '0 2px 8px rgba(28, 27, 24, 0.06)',
        artifact: '0 4px 12px rgba(28, 27, 24, 0.08)',
        fab: '0 4px 12px rgba(28, 27, 24, 0.12)',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
