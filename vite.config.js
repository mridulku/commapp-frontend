// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { resolve } from "path";

export default defineConfig({
  /* ─── Plugins ─────────────────────────────── */
  plugins: [
    react(),            // JSX / HMR
    nodePolyfills(),    // polyfill Node globals (process, buffer…)
  ],

  /* ─── Globals ─────────────────────────────── */
  define: {
    global: "globalThis",
    "process.env": {},  // silence “process is not defined”
  },

  /* ─── Aliases ─────────────────────────────── */
  resolve: {
    alias: {
      // Patch motion-utils case-sensitivity bug (Linux file-systems)
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),
    },
  },

  /* ─── Dependency pre-bundle ───────────────── */
  // Forcing these packages through esbuild makes Vite generate
  // ESM shims that expose *all* the named exports React-Redux needs.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-redux",
      "use-sync-external-store/with-selector",
      "process",
      "buffer",
      "util",
      "stream-browserify",
    ],
  },

  /* ─── Rollup build settings (defaults are fine) ─────────────── */
  build: {
    // keep tree-shaking on; no extra commonjsOptions needed
  },

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
