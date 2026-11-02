import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// SPA: all routes fall back to index.html (dev server + preview handle this).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, open: true },
});
