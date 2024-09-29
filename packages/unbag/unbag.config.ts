import {
  AbsolutePath,
  defineUserConfig,
  defineCliCommand,
  useViteLibConfig,
  useCliCommand,
} from "./src";
import { checkScope } from "../../scripts/scopes";

import pkgJson from "./package.json";
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const viteConfig = useViteLibConfig({
  base: new AbsolutePath({ content: __dirname }),
  pkgJson,
});

export default defineUserConfig({
  base: {
    log: {
      debug: true,
    },
  },
  vite: viteConfig,
  transform: {
    sourcemap: true,
    action: async ({ helper, finalUserConfig }) => {
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
        options: {
          logFilePathRewrite: ({ filePath, tempDir, inputDir }) => {
            const filePaths = new AbsolutePath({ content: filePath });
            console.log({ inputDir: inputDir.content });
            const res = filePaths.toRelativePath({ rel: inputDir });
            console.log({ res: res.content });
            // return res.content;
            return filePath;
          },
        },
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
    scope: {
      name: "unbag",
      check: async ({ name }) => {
        return await checkScope(name);
      },
    },
    changelog: {
      header: `我是更新日志的头部!!!`,
      footer: `我是更新日志的脚部!!!`,
    },
  },
  custom: [
    useCliCommand(
      defineCliCommand({
        useDefaultConfig: () => {
          return {
            a: "",
          };
        },
        defineActions: ({ defineAction }) => {
          return [
            defineAction({
              name: "aaa",
              description: "自定义命令测试",
              options: {
                a: {
                  type: "string",
                },
              },
              configParse: ({ args }) => {
                return {
                  a: args.a,
                };
              },
              run: ({ finalUserConfig, args }) => {
                console.log({ args });
              },
            }),
          ];
        },
      })
    ),
  ],
});
