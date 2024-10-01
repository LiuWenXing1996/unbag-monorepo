import load from "@commitlint/load";
import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";
import { useFs, useRoot } from "unbag";
import type { FinalUserConfig } from "unbag";
import { useCreateRequire } from "./utils";
const require = useCreateRequire()(import.meta.url);
const commitlintConfigConventionalPath = require.resolve(
  "@commitlint/config-conventional"
);
export interface CommitConfig {
  lint: UserConfig;
}
export const CommitConfigDefault: CommitConfig = {
  lint: {
    extends: [commitlintConfigConventionalPath],
    rules: {
      "type-enum": () => {
        return [
          RuleConfigSeverity.Error,
          "always",
          [
            "build",
            "chore",
            "ci",
            "docs",
            "feat",
            "fix",
            "perf",
            "refactor",
            "revert",
            "style",
            "test",
            "release",
          ],
        ];
      },
    },
    prompt: {
      questions: {
        type: {
          enum: {
            release: {
              description: "release a version",
            },
          },
        },
      },
    },
  },
};
export const loadCommitLintConfig = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
}) => {
  const { finalUserConfig } = params;
  const {
    commandConfig: { lint },
    base: { tempDir },
  } = finalUserConfig;
  const fs = useFs();
  const rootPath = useRoot({ finalUserConfig });
  const commitTempDir = rootPath
    .resolve({
      next: tempDir,
    })
    .resolve({
      next: "./commit",
    });

  const tempLintConfigFile = {
    path: commitTempDir.resolve({ next: "./temp-lint-config.mjs" }),
    content: `
  export default {}
      `,
  };
  await fs.outputFile(
    tempLintConfigFile.path.content,
    tempLintConfigFile.content
  );
  const lintConfig = await load(
    //@ts-ignore
    lint,
    { file: tempLintConfigFile.path.content, cwd: rootPath.content }
  );
  return lintConfig;
};
