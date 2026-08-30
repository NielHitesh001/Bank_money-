import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8766",
        changeOrigin: true,
      },
      "/metrics": {
        target: "http://127.0.0.1:8766",
        changeOrigin: true,
      },
      "/monitoring": {
        target: "http://127.0.0.1:8766",
        changeOrigin: true,
      },
    },
  },
});
