import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const projectRoot = new URL(".", import.meta.url).pathname;

function publicCataloguePlugin() {
  return {
    name: "public-catalogue",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "data/retailer-listings.json",
        source: readFileSync(
          resolve(projectRoot, "data/retailer-listings.json"),
          "utf8",
        ),
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/beyblade-x-scorebook/" : "/",
  plugins: [react(), tailwindcss(), publicCataloguePlugin()],
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },
}));
