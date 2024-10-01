import {
  AbsolutePath,
  defineCliCommand,
  defineUserConfig,
  useCliCommand,
} from "unbag";
import { RuleConfigSeverity } from "@commitlint/types";
import { $, execa } from "execa";
import { CreateCommand, resolveTemplates } from "unbag-command-create";
import path from "node:path";
import { useCustomTemplates } from "unbag-build-tools";
import { getScopes } from "unbag-build-tools";
import { CommitCommand } from "unbag-command-commit";
import { ParallelCliCommand } from "unbag-command-parallel";

const scopes = await getScopes();
export default defineUserConfig({
  commands: [
    useCliCommand(CommitCommand, {
      lint: {
        extends: ["@commitlint/config-pnpm-scopes"],
        rules: {
          "scope-empty": [RuleConfigSeverity.Error, "never"],
          "scope-enum": [RuleConfigSeverity.Error, "always", [...scopes]],
        },
      },
    }),
    useCliCommand(ParallelCliCommand, {
      commands: [
        {
          name: "unbag",
          npmScript: "pnpm --filter 'unbag' dev",
        },
        {
          name: "unbag-unit-test",
          npmScript: "pnpm --filter 'unbag' test-watch",
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
    }),
    useCliCommand(CreateCommand, {
      templates: [
        ...(await useCustomTemplates()).map((e) => {
          const { path, ...rest } = e;
          return {
            ...rest,
            path: new AbsolutePath({ content: path }),
          };
        }),
      ],
    }),
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
