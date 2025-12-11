/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "primary-dark": "#5558e3",
        dark: "#1a1a1a",
        "dark-light": "#666",
        border: "#e8e8e8",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "'Roboto'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
