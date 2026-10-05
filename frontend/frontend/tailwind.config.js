/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#14181f',
        panel: '#1c2620',
        panelraised: '#232f26',
        line: '#333d29',
        ink: '#e8e6d9',
        muted: '#8b9481',
        grass: '#6b9b37',
        grassdim: '#4d7228',
        amber: '#c78a3d',
        danger: '#a8453e',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
