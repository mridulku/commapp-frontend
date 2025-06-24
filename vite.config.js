// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { resolve } from "path";
import path from "path";

/* ── absolute CJS entry paths (needed for namedExports) ─────────── */
const reactCjs     = path.resolve(__dirname, "node_modules/react/index.js");
const selectorCjs  = path.resolve(
  __dirname,
  "node_modules/use-sync-external-store/with-selector.js"
);

export default defineConfig({
  /* ─── Plugins ─────────────────────────────── */
  plugins: [react(), nodePolyfills()],

  /* ─── Globals ─────────────────────────────── */
  define: {
    global: "globalThis",
    "process.env": {},          // silence “process is not defined”
  },

  /* ─── Aliases ─────────────────────────────── */
  resolve: {
    alias: {
      /* Motion case-sensitivity patch */
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),

      /* React 18 JSX runtime sub-paths */
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

  /* ─── Dependency pre-bundle (dev) ─────────── */
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

  /* ─── Rollup build tweaks ─────────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],          // run on every dep
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",

      /* Explicit synthetic named exports for the two CJS files */
      namedExports: {
        [reactCjs]: [
          "version", "createElement", "createContext",
          "useEffect", "useLayoutEffect", "useMemo",
          "useRef", "useContext", "useCallback",
          "useSyncExternalStore", "memo", "forwardRef"
        ],
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
