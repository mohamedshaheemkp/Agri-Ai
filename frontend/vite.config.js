import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    host: true, // Exposes the server to the local network
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000", // backend server
        changeOrigin: true,
        secure: false, // In case backend uses a self-signed cert too
      },
    },
  },
});
