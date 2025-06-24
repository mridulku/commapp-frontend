// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), nodePolyfills()],

  define: {
    global: "globalThis",
    "process.env": {},
  },

  resolve: {
    alias: {
      // patch motion-utils’ case-sensitivity bug
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),
    },
  },

  optimizeDeps: {
    include: ["process", "buffer", "util", "stream-browserify"],
  },

  // no extra commonjsOptions—Vite’s defaults handle React + React-Redux
  build: {
    treeshake: true,        // back to normal tree-shaking
  },

  test: {
    globals: true,
    environment: "jsdom",
  },
});
