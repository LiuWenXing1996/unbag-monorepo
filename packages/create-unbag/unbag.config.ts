import { defineUserConfig } from "unbag";

export default defineUserConfig({
  transform: {
    action: async ({ helper }) => {
      console.log("create-unbag :transform");
      const { esbuild, alias, babel, out, dts, merge } = helper;
      const aliasProcess = await alias({
        name: "alias",
        options: {
          paths: {
            "@": "src",
          },
        },
      });
      const esbuildProcess = await esbuild({
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
        parentUid: aliasProcess,
      });
      const jsonProcess = await esbuild({
        name: "esbuild-json",
        options: {
          esbuild: {
            format: "esm",
            loader: "json",
          },
          extMapping: {
            ".json": ".json.js",
          },
        },
        parentUid: aliasProcess,
      });
      const mergeAllProcess = await merge({
        name: "merge-all",
        processUidList: [jsonProcess, esbuildProcess],
      });
      const esmBabelProcess = await babel({
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
        parentUid: mergeAllProcess,
      });
      const dtsProcess = await dts({
        name: "dts",
        parentUid: aliasProcess,
      });
      const esmDtsBabelProcess = await babel({
        name: "esmDts",
        options: {
          babel: {
            plugins: [
              "@babel/plugin-syntax-typescript",
              ["babel-plugin-add-import-extension", { extension: "mts" }],
            ],
          },
          extMapping: {
            ".ts": ".mts",
            ".mts": ".mts",
            ".cts": ".mts",
          },
        },
        parentUid: dtsProcess,
      });
      await Promise.all([
        await out({ processUid: esmDtsBabelProcess, output: "./dist/types" }),
        await out({ processUid: esmBabelProcess, output: "./dist/esm" }),
      ]);
    },
  },
});
