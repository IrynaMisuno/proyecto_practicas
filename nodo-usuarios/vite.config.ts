import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Mismo origen para la interfaz y la API: la cookie de sesión funciona sin CORS.
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  preview: {
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
