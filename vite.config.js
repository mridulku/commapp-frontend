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




    // 🩹 <--  add this one line
      './globalThis-config.mjs': resolve(
        __dirname,
        'node_modules/motion-utils/dist/es/globalthis-config.mjs'
      ),
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
});