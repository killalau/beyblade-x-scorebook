import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
  plugins: [react(), publicCataloguePlugin()],
  build: {
    rollupOptions: {
      input: {
        current: resolve(projectRoot, "index.html"),
        react: resolve(projectRoot, "react.html"),
      },
    },
  },
}));
