// vite.config.js - Alternative approach
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path, { resolve } from "path";

/* Use ES module versions for React */
const reactEs = path.resolve(__dirname, "node_modules/react/index.js");
const reactDomEs = path.resolve(__dirname, "node_modules/react-dom/index.js");
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

      // Use the ES module version of React
      react: reactEs,
      "react-dom": reactDomEs,
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
    // Ensure React and react-redux are optimized together
    force: true,
  },

  /* ─── Rollup CJS handling ─────────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",
      // Let Vite handle React exports automatically
      namedExports: {
        [selectorCjs]: ["useSyncExternalStoreWithSelector"],
      },
    },
  },

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});