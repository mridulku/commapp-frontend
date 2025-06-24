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
      /* motion-utils case-sensitivity patch */
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),

      /* React 18 JSX runtime sub-paths — required by plugin-react */
      "react/jsx-runtime":     resolve(
        __dirname,
        "node_modules/react/jsx-runtime.js"
      ),
      "react/jsx-dev-runtime": resolve(
        __dirname,
        "node_modules/react/jsx-dev-runtime.js"
      ),
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "react-redux",                         // ← CJS 8.1.3 pre-bundled
      "use-sync-external-store/with-selector",
      "process",
      "buffer",
      "util",
      "stream-browserify",
    ],
  },

  /* No extra commonjsOptions or treeshake tweaks needed */
  build: {},

  test: {
    globals: true,
    environment: "jsdom",
  },
});
