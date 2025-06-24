// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { resolve } from "path";

export default defineConfig({
  /* ──────────────────────────
     Plugins
  ────────────────────────── */
  plugins: [
    react(),
    nodePolyfills()  // Node-core shims (process, buffer, stream…)
  ],

  /* ──────────────────────────
     Globals / polyfills
  ────────────────────────── */
  define: {
    global: "globalThis",
    "process.env": {},         // stop “process is not defined”
  },

  /* ──────────────────────────
     Module resolution tweaks
  ────────────────────────── */
  resolve: {
    alias: {
      // Browser-friendly Node core
      process: "process/browser",
      stream:  "stream-browserify",
      util:    "util",
      buffer:  "buffer",

      // 🔧 Patch motion-utils’ missing file (case-sensitive Linux)
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),

      // 🔧 React deep import → normal entry (Rollup named-export fix)
      "react/index.js": "react",

      // 🔧 react-redux helper
      "use-sync-external-store/with-selector.js":
        "use-sync-external-store/with-selector",
    },
  },

  /* ──────────────────────────
     Vite’s dependency pre-bundle
  ────────────────────────── */
  optimizeDeps: {
    include: ["process", "buffer", "util", "stream-browserify"],
  },

  /* ──────────────────────────
     Rollup CommonJS handling
  ────────────────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],        // run @rollup/plugin-commonjs on everything
      transformMixedEsModules: true,    // handle hybrid ESM+CJS files
    },
  },

  /* ──────────────────────────
     Vitest
  ────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
