import { defineCliCommand, defineUserConfig, useCliCommand } from "unbag";
import { RuleConfigSeverity } from "@commitlint/types";
import { getScopes } from "./scripts/scopes";
import { $, execa } from "execa";

const scopes = await getScopes();
export default defineUserConfig({
  commit: {
    lint: {
      extends: ["@commitlint/config-pnpm-scopes"],
      rules: {
        "scope-empty": [RuleConfigSeverity.Error, "never"],
        "scope-enum": [RuleConfigSeverity.Error, "always", [...scopes]],
      },
    },
  },
  parallel: {
    commands: [
      {
        name: "unbag",
        npmScript: "pnpm --filter 'unbag' dev",
      },
      {
        name: "unbag-docs",
        npmScript: "pnpm --filter 'unbag-docs' dev",
      },
      {
        name: "create-unbag",
        npmScript: "pnpm --filter 'create-unbag' dev",
      },
    ],
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
              name: "init",
              run: async ({ finalUserConfig }) => {
                finalUserConfig.commandConfig.a;
                await execa({
                  stdout: ["pipe", "inherit"],
                })`pnpm --filter create-unbag build`;
              },
            }),
          ];
        },
      })
    ),
  ],
});
