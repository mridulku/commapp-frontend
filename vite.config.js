// vite.config.js - React Redux compatibility fix
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path, { resolve } from "path";

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

      // Force proper React module resolution
      "react": resolve(__dirname, "node_modules/react"),
      "react-dom": resolve(__dirname, "node_modules/react-dom"),
    },
    // Force ES module resolution with fallbacks
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
      "use-sync-external-store",
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
    rollupOptions: {
      external: [],
      output: {
        interop: 'auto',
        format: 'es',
      },
      // Fix for react-redux import issues
      plugins: [
        {
          name: 'react-redux-fix',
          resolveId(id) {
            // Handle react-redux imports
            if (id === 'react-redux') {
              return resolve(__dirname, 'node_modules/react-redux/dist/react-redux.mjs');
            }
            // Handle use-sync-external-store imports
            if (id === 'use-sync-external-store/with-selector') {
              return resolve(__dirname, 'node_modules/use-sync-external-store/with-selector.js');
            }
            return null;
          },
        },
      ],
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: "auto",
      // Explicit module handling
      namedExports: {
        'react': [
          'createElement',
          'createContext', 
          'useContext',
          'useEffect',
          'useLayoutEffect',
          'useMemo',
          'useRef',
          'useCallback',
          'useSyncExternalStore',
          'memo',
          'forwardRef',
          'useState',
          'useReducer',
          'Component',
          'PureComponent',
          'Fragment',
          'StrictMode',
          'Suspense',
          'cloneElement',
          'isValidElement',
          'Children',
          'version'
        ],
        'react-dom': [
          'render',
          'createRoot',
          'hydrateRoot',
          'findDOMNode',
          'unmountComponentAtNode',
          'createPortal',
          'flushSync'
        ],
        'use-sync-external-store/with-selector': ['useSyncExternalStoreWithSelector'],
      },
    },
  },

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});