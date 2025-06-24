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
      /* Motion case-sensitivity patch */
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),

      /* React 18 JSX-runtime entry points */
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

  /* ─── Dependency pre-bundle (dev only) ────── */
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

  /* ─── Rollup / build tweaks ───────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],          // run on every dep
      transformMixedEsModules: true,      // CJS+ESM hybrids
      requireReturnsDefault: "preferred", // keep default + named exports

      // explicit names React & the selector helper must expose
      namedExports: {
        react: [
          "version", "createElement", "createContext",
          "useEffect", "useLayoutEffect", "useMemo",
          "useRef", "useContext", "useCallback",
          "useSyncExternalStore", "memo", "forwardRef"
        ],
        "use-sync-external-store/with-selector": [
          "useSyncExternalStoreWithSelector"
        ],
      },
    },
  },

  /* ─── Vitest ─────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
