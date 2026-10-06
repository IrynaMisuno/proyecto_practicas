/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // HTTPS también en desarrollo (certificado autofirmado), para que la cookie Secure funcione igual que en producción.
  plugins: [react(), tailwindcss(), basicSsl()],
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
    setupFiles: "./frontend/test-utils/setup.ts",
  },
});
