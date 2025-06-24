// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path, { resolve } from "path";

/* CJS entry files that need explicit export maps */
const selectorCjs = path.resolve(
  __dirname,
  "node_modules/use-sync-external-store/with-selector.js",
);

export default defineConfig({
  /* ─── Plugins ─────────────────────────────── */
  plugins: [react(), nodePolyfills()],

  /* ─── Globals ─────────────────────────────── */
  define: {
    global: "globalThis",
    "process.env": {}, // silence "process is not defined"
  },

  /* ─── Aliases ─────────────────────────────── */
  resolve: {
    alias: {
      // motion-utils case-sensitivity patch
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs",
      ),

      // React JSX-runtime sub-paths (required by @vitejs/plugin-react)
      "react/jsx-runtime": resolve(
        __dirname,
        "node_modules/react/jsx-runtime.js",
      ),
      "react/jsx-dev-runtime": resolve(
        __dirname,
        "node_modules/react/jsx-dev-runtime.js",
      ),

      // Let Vite handle React module resolution naturally
      // Don't alias react or react-dom at all
    },
  },

  /* ─── Dev dependency pre-bundle ───────────── */
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
    // Force pre-bundling of react and react-redux together
    force: true,
  },

  /* ─── Rollup CJS handling ─────────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",
      // Remove the explicit namedExports for React - let Vite handle it
      namedExports: {
        [selectorCjs]: ["useSyncExternalStoreWithSelector"],
      },
    },
    rollupOptions: {
      // Ensure React is treated as external in the right way
      external: (id) => {
        // Don't externalize react for the build
        return false;
      },
    },
  },

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});