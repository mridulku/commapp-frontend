// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";   // ← NEW
import { resolve } from "path";          // ← add this


export default defineConfig({
  plugins: [
    react(),
    nodePolyfills()               // ← adds Node-core shims (process, buffer, stream…)
  ],

  /* make the OpenAI SDK (and other Node libs) happy in the browser */
  define: {
    global: "globalThis",
    "process.env": {},            // stops “process is not defined”
  },

  resolve: {
    alias: {
      process: "process/browser",
      stream:  "stream-browserify",
      util:    "util",
      buffer:  "buffer",




         'motion-utils/dist/es/globalThis-config.mjs': resolve(
           __dirname,
           'node_modules/motion-utils/dist/es/globalthis-config.mjs'
         ),

         // 🆕 tell Rollup to use the main React CJS bundle
         'react/index.js': 'react',

         // 🆕 same idea for the selector helper used by react-redux
         'use-sync-external-store/with-selector.js':
           'use-sync-external-store/with-selector',
    },
  },

  optimizeDeps: {
    include: ["process", "buffer", "util", "stream-browserify"],
  },

  /* existing Vitest settings */
  test: {
    globals: true,
    environment: "jsdom",
  },

  build: {
    commonjsOptions: {
      /**
       * Ensure EVERY .js file under node_modules is run through
       * @rollup/plugin-commonjs so named exports like
       *   useSyncExternalStoreWithSelector
       * are generated automatically.
       */
      include: [/node_modules/],
      transformMixedEsModules: true,   // handle CJS+ESM hybrids
    },
    },
});