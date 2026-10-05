/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Mismo origen para la interfaz y la API: la cookie de sesión funciona sin CORS.
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  preview: {
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  test: {
    // jsdom simula un navegador para poder pintar componentes en los tests.
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
