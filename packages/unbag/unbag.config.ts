import { defineUserConfig } from "./src";

export default defineUserConfig({
  log: {
    debug: true,
  },
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
      const [esmDts, cjsDts] = await Promise.all([
        await babel({
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
        }),
        await babel({
          name: "cjsDts",
          options: {
            babel: {
              plugins: [
                "@babel/plugin-syntax-typescript",
                ["babel-plugin-add-import-extension", { extension: "cts" }],
              ],
            },
            extMapping: {
              ".ts": ".cts",
              ".mts": ".cts",
              ".cts": ".cts",
            },
          },
          parentUid: dtsProcess,
        }),
      ]);
      await Promise.all([
        await out({ processUid: dtsProcess, output: "./dist/types/default" }),
        await out({ processUid: cjsDts, output: "./dist/types/cjs" }),
        await out({ processUid: esmDts, output: "./dist/types/esm" }),
        await out({ processUid: esmBabel, output: "./dist/esm" }),
        await out({ processUid: cjsBabel, output: "./dist/cjs" }),
      ]);
    },
  },
  release: {
    scope: "unbag",
    branch: {
      mainCheckDisable: true,
      cleanCheckDisable: true,
    },
    changelog: {
      header: "我是更新日志的头部!!!",
      footer: "我是更新日志的脚部!!!",
      fileWriteDisable: false,
    },
    commit: {
      disable: true,
    },
    tag: {
      prefix: "unbag@",
      disable: true,
    },
  },
});
