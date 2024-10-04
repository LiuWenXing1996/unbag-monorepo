import { gitCz } from "./git-cz";
import { CommitConfig, CommitConfigDefault } from "./config";
import { commitLint } from "./lint";
import { defineCommand, type FinalUserConfig } from "unbag";

export const commit = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
}) => {
  const { finalUserConfig } = params;
  await gitCz({ finalUserConfig });
};

export const CommitCommand = defineCommand({
  defaultConfig: CommitConfigDefault,
  name: "commit",
  description: "提交文件",
  run: async ({ finalUserConfig }) => {
    await commit({ finalUserConfig });
  },
  subCommands: ({ defineSubCommand }) => {
    return [
      defineSubCommand({
        name: "lint",
        description: "提交文件",
        options: {
          message: {
            alias: "m",
            type: "string",
          },
        },
        run: async ({ finalUserConfig, args }) => {
          await commitLint({ finalUserConfig, message: args.message || "" });
        },
      }),
    ];
  },
});
