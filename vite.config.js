import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Excalidraw ships ESM that must be pre-bundled by Vite, and needs to be
// handled as a dependency. We also set the dev server port to 3000 to match
// the README's "open http://localhost:3000" instruction.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ["@excalidraw/excalidraw", "@excalidraw/mermaid-to-excalidraw"],
  },
  define: {
    "process.env.IS_PREACT": JSON.stringify("false"),
  },
});
