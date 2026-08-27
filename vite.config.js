import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relativa para o build funcionar tanto em domínio raiz
// quanto em subpasta (ex.: GitHub Pages em /TemAi/)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
