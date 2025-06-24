// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { resolve } from "path";

export default defineConfig({
  /* ─── Plugins ─────────────────────────────── */
  plugins: [react(), nodePolyfills()],

  /* ─── Globals ─────────────────────────────── */
  define: {
    global: "globalThis",
    "process.env": {},
  },

  /* ─── Aliases ─────────────────────────────── */
  resolve: {
    alias: {
      /* 1️⃣  Motion case-sensitivity patch */
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),

      /* 2️⃣  ONLY alias the JSX-runtime sub-paths (they exist in react 18) */
      "react/jsx-runtime":      "react/jsx-runtime.js",
      "react/jsx-dev-runtime":  "react/jsx-dev-runtime.js",
    },
  },

  /* ─── Dependency pre-bundle ───────────────── */
  // Pre-bundle React & friends so esbuild emits proper ESM shims
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "react-redux",
      "use-sync-external-store/with-selector",
      "process",
      "buffer",
      "util",
      "stream-browserify",
    ],
  },

  /* ─── Build (defaults are now fine) ───────── */
  build: {},

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
