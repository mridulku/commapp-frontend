// vite.config.js - Aggressive module resolution fix
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path, { resolve } from "path";

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
    },
    // Force ES module resolution
    conditions: ['import', 'module', 'browser', 'default'],
    mainFields: ['module', 'browser', 'main'],
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
    // Force pre-bundling with ES modules
    esbuildOptions: {
      mainFields: ['module', 'main'],
      conditions: ['import', 'module', 'browser', 'default'],
    },
  },

  /* ─── Rollup CJS handling ─────────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: "auto",
      // Force React to be treated as ES module
      namedExports: {
        "react": [
          "createElement",
          "createContext", 
          "useContext",
          "useEffect",
          "useLayoutEffect",
          "useMemo",
          "useRef",
          "useCallback",
          "useSyncExternalStore",
          "memo",
          "forwardRef",
          "useState",
          "useReducer",
          "Component",
          "PureComponent",
          "Fragment",
          "StrictMode",
          "Suspense",
          "cloneElement",
          "isValidElement",
          "Children",
          "version"
        ],
        [selectorCjs]: ["useSyncExternalStoreWithSelector"],
      },
    },
    rollupOptions: {
      output: {
        interop: 'auto',
      },
    },
  },

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});