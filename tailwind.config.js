/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Spotify-inspired dark theme
        "dark-base": "#121212",
        "dark-surface": "#181818",
        "dark-elevated": "#1f1f1f",
        "dark-card": "#252525",
        "dark-card-alt": "#272727",
        
        // Text colors
        "text-base": "#ffffff",
        "text-secondary": "#b3b3b3",
        "text-tertiary": "#cbcbcb",
        "text-muted": "#7c7c7c",
        
        // Brand colors
        "brand-green": "#1ed760",
        "brand-green-dark": "#1db954",
        
        // Semantic colors
        "semantic-negative": "#f3727f",
        "semantic-warning": "#ffa42b",
        "semantic-info": "#539df5",
        
        // Borders
        "border-dark": "#4d4d4d",
        "border-light": "#7c7c7c",
        "border-separator": "#b3b3b3",
        
        // Legacy (for backwards compatibility)
        background: "#121212",
        foreground: "#ffffff",
        primary: "#1ed760",
        secondary: "#181818",
        accent: "#1ed760",
        muted: "#b3b3b3",
        border: "#4d4d4d",
      },
      fontFamily: {
        sans: [
          "SpotifyMixUI",
          "SpotifyMixUITitle",
          "CircularSp-Arab",
          "CircularSp-Hebr",
          "CircularSp-Cyrl",
          "CircularSp-Grek",
          "CircularSp-Deva",
          "Outfit",
          "Helvetica Neue",
          "helvetica",
          "arial",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "MS Gothic",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "'Roboto'",
          "sans-serif",
        ],
      },
      borderRadius: {
        "pill": "500px",
        "pill-full": "9999px",
      },
      boxShadow: {
        "dark-heavy": "rgba(0, 0, 0, 0.5) 0px 8px 24px",
        "dark-medium": "rgba(0, 0, 0, 0.3) 0px 8px 8px",
        "dark-inset": "rgb(18, 18, 18) 0px 1px 0px, rgb(124, 124, 124) 0px 0px 0px 1px inset",
      },
      letterSpacing: {
        "button": "1.4px",
        "button-wide": "2px",
      },
    },
  },
  plugins: [],
};
