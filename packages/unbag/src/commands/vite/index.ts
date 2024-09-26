import { defineCliCommand } from "@/core/cli";
import type { UserConfig } from "vite";
import type { InlineConfig } from "vitest/node";
import * as vite from "vite";
import { createVitest } from "vitest/node";

export type ViteConfig = UserConfig & {
  test?: InlineConfig;
};

export const ViteCliCommand = defineCliCommand<ViteConfig>({
  useDefaultConfig: () => {
    return {};
  },
  defineSubCommands: ({ defineSubCommand }) => {
    return [
      defineSubCommand({
        name: "vite-build",
        description: "执行 vite build 操作",
        options: {
          watch: {
            alias: "w",
            boolean: true,
          },
          minify: {
            alias: "m",
            boolean: true,
          },
        },
        configParse: ({ args }) => {
          return {
            build: {
              watch: args.watch ? {} : undefined,
              minify: args.minify,
            },
          };
        },
        action: async ({ finalUserConfig }) => {
          const commandConfig = finalUserConfig.commandConfig as ViteConfig;
          await vite.build({
            ...commandConfig,
            configFile: false,
          });
        },
      }),
      defineSubCommand({
        name: "vitest",
        description: "执行 vitest 操作",
        options: {
          watch: {
            alias: "w",
            boolean: true,
          },
        },
        configParse: ({ args }) => {
          return {
            test: {
              watch: args.watch,
            },
          };
        },
        action: async ({ finalUserConfig }) => {
          const commandConfig = finalUserConfig.commandConfig as ViteConfig;
          const vitest = await createVitest(
            "test",
            {
              ...commandConfig.test,
              config: false,
            },
            commandConfig
          );
          await vitest.start();
          if (!commandConfig.test?.watch) {
            await vitest.close();
          }
        },
      }),
    ];
  },
});
