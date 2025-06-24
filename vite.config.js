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
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),
    },
  },

  /**
   * 🔑  Tell Vite’s optimise-deps step to pre-bundle React,
   *     React-DOM, React-Redux and the selector helper.
   *     The generated shims expose all the named exports
   *     (useEffect, useContext, useSyncExternalStoreWithSelector …)
   *     that Rollup needs at build-time.
   */
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

  /* nothing else has to change */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
