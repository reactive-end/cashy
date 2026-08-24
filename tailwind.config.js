/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#FAFAF7',
        card: '#FFFFFF',
        line: '#ECECE7',
        ink: '#1C1C1A',
        muted: '#6B6B66',
        faint: '#A8A8A2',
        accent: '#2F6B4F',
        'accent-soft': '#EDF3EF',
        danger: '#A63D3D',
        'danger-soft': '#F6ECEC',
        warn: '#8A6D2F',
        'warn-soft': '#F5EFE2'
      },
      fontFamily: {
        display: ['Fraunces_600SemiBold'],
        title: ['Fraunces_500Medium'],
        sans: ['Manrope_400Regular'],
        'sans-medium': ['Manrope_500Medium'],
        'sans-semibold': ['Manrope_600SemiBold'],
        'sans-bold': ['Manrope_700Bold']
      }
    }
  },
  plugins: []
}
