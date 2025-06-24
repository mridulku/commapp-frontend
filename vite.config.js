// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import path, { resolve } from "path";

/* absolute CJS entry paths */
const reactCjs     = path.resolve(__dirname, "node_modules/react/index.js");
const reactDomCjs  = path.resolve(__dirname, "node_modules/react-dom/index.js");
const selectorCjs  = path.resolve(
  __dirname,
  "node_modules/use-sync-external-store/with-selector.js"
);

export default defineConfig({
  /* Plugins */
  plugins: [react(), nodePolyfills()],

  /* Globals */
  define: {
    global: "globalThis",
    "process.env": {},
  },

  /* Aliases — EVERY react* import now resolves to the CJS file above */
  resolve: {
    alias: {
      // motion-utils typo patch
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),

      // React runtime sub-paths
      "react/jsx-runtime":     resolve(__dirname, "node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),

      // Force all plain imports to the same CommonJS file
      react: reactCjs,
      "react/index.js": reactCjs,
      "react-dom": reactDomCjs,
      "react-dom/index.js": reactDomCjs,
    },
  },

  /* Dev pre-bundle */
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-redux",
      "react-dom/client",
      "use-sync-external-store/with-selector",
      "process",
      "buffer",
      "util",
      "stream-browserify",
    ],
  },

  /* Rollup: declare the synthetic named exports */
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      requireReturnsDefault: "preferred",
      namedExports: {
        [reactCjs]: [
          "version", "createElement", "createContext",
          "useEffect", "useLayoutEffect", "useMemo",
          "useRef", "useContext", "useCallback",
          "useSyncExternalStore", "memo", "forwardRef",
        ],
        [selectorCjs]: ["useSyncExternalStoreWithSelector"],
      },
    },
  },

  /* Vitest */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
