// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import nodePolyfills from "rollup-plugin-polyfill-node";
import { resolve } from "path";

export default defineConfig({
  /* ─── Plugins ─────────────────────────────── */
  plugins: [react(), nodePolyfills()],

  /* ─── Globals / polyfills ─────────────────── */
  define: {
    global: "globalThis",
    "process.env": {},               // stop “process is not defined”
  },

  /* ─── Module resolution tweaks ────────────── */
  resolve: {
    alias: {
      // patch motion-utils’ case-sensitivity bug
      "motion-utils/dist/es/globalThis-config.mjs": resolve(
        __dirname,
        "node_modules/motion-utils/dist/es/globalthis-config.mjs"
      ),
    },
  },

  /* ─── Vite dependency pre-bundle ──────────── */
  optimizeDeps: {
    include: ["process", "buffer", "util", "stream-browserify"],
  },

  /* ─── Rollup / build tweaks ───────────────── */
  build: {
    commonjsOptions: {
      include: [/node_modules/],          // transform every dep
      transformMixedEsModules: true,      // handle CJS+ESM hybrids
      requireReturnsDefault: "preferred", // default + named exports

      // explicit names React + helper should expose
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

    treeshake: true,   // keep normal tree-shaking
  },

  /* ─── Vitest ──────────────────────────────── */
  test: {
    globals: true,
    environment: "jsdom",
  },
});
