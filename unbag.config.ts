import { defineCliCommand, defineUserConfig } from "unbag";
import { RuleConfigSeverity } from "@commitlint/types";
import { getScopes } from "./scripts/scopes";
import { $ } from "execa";

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
    ],
  },
  custom: [
    defineCliCommand({
      useDefaultConfig: () => {
        return {};
      },
      defineSubCommands: ({ defineSubCommand }) => {
        return [
          defineSubCommand({
            name: "init",
            action: async () => {
              console.log("initsssss");
              // await $`pnpm `;
            },
          }),
        ];
      },
    }),
  ],
});
