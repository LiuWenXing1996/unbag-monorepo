/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkgJson from "./package.json";
import dts from "vite-plugin-dts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const externals = [
  ...Object.keys(pkgJson.dependencies || []),
  ...Object.keys(pkgJson.devDependencies || []),
];
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [
    dts({
      entryRoot: resolve(__dirname, "./src"),
      outDir: resolve(__dirname, "./dist/types"),
      rollupTypes: false,
    }),
  ],
  test: {},
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, "./src/index.ts"),
      name: "unbag",
      formats: ["es", "cjs"],
      fileName: (format) => {
        if (["es", "esm"].includes(format)) {
          return `esm/index.mjs`;
        }
        if (["cjs"].includes(format)) {
          return `cjs/index.cjs`;
        }
        throw Error(`unknown format`);
      },
    },
    rollupOptions: {
      external: (id: string) => {
        if (id.startsWith("node:")) {
          return true;
        }
        return externals.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
      },
    },
  },
});
