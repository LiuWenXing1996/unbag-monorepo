import { defineUserConfig } from "./src";

export default defineUserConfig({
  transform: {
    sourcemap: true,
    action: async ({ helper }) => {
      const { esbuild, alias, babel, out, dts } = helper;
      const aliasUid = await alias({
        name: "alias",
        options: {
          paths: {
            "@": "src",
          },
        },
      });
      const esbuildUid = await esbuild({
        name: "esbuild",
        options: {
          esbuild: {
            format: "esm",
            loader: "ts",
          },
          extMapping: {
            ".mts": ".js",
            ".ts": ".js",
            ".cts": ".js",
          },
        },
        parentUid: aliasUid,
      });
      const esmBabel = await babel({
        name: "esm-babel",
        options: {
          babel: {
            plugins: [
              ["babel-plugin-add-import-extension", { extension: "mjs" }],
            ],
          },
          extMapping: {
            ".mjs": ".mjs",
            ".js": ".mjs",
            ".cjs": ".mjs",
          },
        },
        parentUid: esbuildUid,
      });
      const cjsBabel = await babel({
        name: "cjs-babel",
        options: {
          babel: {
            plugins: [
              ["babel-plugin-add-import-extension", { extension: "cjs" }],
              ["@babel/transform-modules-commonjs"],
            ],
          },
          extMapping: {
            ".mjs": ".cjs",
            ".js": ".cjs",
            ".cjs": ".cjs",
          },
        },
        parentUid: esbuildUid,
      });
      const dtsProcess = await dts({
        name: "dts",
        options: {},
        parentUid: aliasUid,
      });
      await out({ processUid: dtsProcess, output: "./dist/types" });
      await out({ processUid: esmBabel, output: "./dist/esm" });
      await out({ processUid: cjsBabel, output: "./dist/cjs" });
    },
  },
  release: {
    scope: "unbag",
    branch: {
      mainCheckDisable: true,
    },
    tag: {
      prefix: "unbag@",
      disable: true,
    },
  },
});
