/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'mint-light': '#EBF2EE',
        'mint-primary': '#4BAE7D',
        'mint-dark': '#2E7A5A',
        'mint-accent': '#C6E4D5',
        'salmon': '#FF7C74',
        'glass': 'rgba(255, 255, 255, 0.85)',
        'glass-dark': 'rgba(255, 255, 255, 0.65)',
        dark: "#1A1A19", 
        light: "#F5F5F5",
      },
    },
  },
  plugins: [],
}
