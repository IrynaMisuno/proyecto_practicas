const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // Verde menta / aguamarina de la marca. Texto blanco solo sobre 700 o más oscuro;
        // sobre 300-400 (botón principal) el texto va en 950 (contraste ≥ 4.5:1).
        mint: {
          50: "#f3fcfa",
          100: "#d5f6ee",
          200: "#aaeddc",
          300: "#77dfc6",
          400: "#48cbb0",
          500: "#25b096",
          600: "#178d79",
          700: "#147264",
          800: "#145b51",
          900: "#134b44",
          950: "#062d28",
        },
      },
    },
  },
  plugins: [],
};
