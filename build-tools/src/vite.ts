/// <reference types="vitest/config" />
import dts from "vite-plugin-dts";
import path from "node:path";
import babel from "vite-plugin-babel";
import { type UserConfig } from "vite";

export const useViteLibConfig = (params: {
  base: string;
  pkgJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  minify?: boolean;
}): UserConfig => {
  const { pkgJson, base } = params;
  const minify = params.minify === undefined ? false : params.minify;
  const baseValue = base;
  const externals = [
    ...Object.keys(pkgJson.dependencies || []),
    ...Object.keys(pkgJson.devDependencies || []),
    ...Object.keys(pkgJson.peerDependencies || []),
  ];
  const config: UserConfig = {
    resolve: {
      alias: {
        "@": path.resolve(baseValue, "./src"),
      },
    },
    plugins: [
      dts({
        entryRoot: path.resolve(baseValue, "./src"),
        outDir: path.resolve(baseValue, "./dist/types"),
        rollupTypes: false,
      }),
      babel({
        babelConfig: {
          presets: ["@babel/preset-typescript"],
          plugins: [
            [
              "babel-plugin-polyfill-corejs3",
              {
                method: "usage-pure",
                version: "3.81",
              },
            ],
          ],
          targets: {
            node: "18",
          },
        },
        filter: /\.[jt]sx?$/,
      }),
    ],
    test: {
      watch: false,
      dir: path.resolve(baseValue, "./src"),
    },
    build: {
      sourcemap: false,
      minify: minify,
      // target: "es2015",
      lib: {
        entry: path.resolve(baseValue, "./src/index.ts"),
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
          return externals.some(
            (pkg) => id === pkg || id.startsWith(`${pkg}/`)
          );
        },
      },
    },
  };
  return config;
};
