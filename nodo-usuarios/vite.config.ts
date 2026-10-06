/// <reference types="vitest/config" />
import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// HTTPS también en desarrollo, para que la cookie Secure funcione igual que en producción.
// Con `npm run certs` (mkcert) el certificado es de confianza; si no existe, se usa uno
// autofirmado y el navegador avisa de que no puede verificarlo.
const certFile = "certs/localhost.pem";
const keyFile = "certs/localhost-key.pem";
const trustedCert = existsSync(certFile) && existsSync(keyFile)
  ? { cert: readFileSync(certFile), key: readFileSync(keyFile) }
  : undefined;

export default defineConfig({
  plugins: [react(), tailwindcss(), ...(trustedCert ? [] : [basicSsl()])],
  server: {
    https: trustedCert,
    // Mismo origen para la interfaz y la API: la cookie de sesión funciona sin CORS.
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  preview: {
    https: trustedCert,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  test: {
    // jsdom simula un navegador para poder pintar componentes en los tests.
    environment: "jsdom",
    setupFiles: "./frontend/test-utils/setup.ts",
  },
});
