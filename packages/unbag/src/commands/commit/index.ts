import { FinalUserConfig } from "@/core/user-config";
import { gitCz } from "./git-cz";
import { CommitConfig, CommitConfigDefault } from "./config";
import { defineCliCommand } from "@/core/cli";
import { commitLint } from "./lint";

export const commit = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
}) => {
  const { finalUserConfig } = params;
  await gitCz({ finalUserConfig });
};

export const CommitCommand = defineCliCommand<CommitConfig>({
  useDefaultConfig: () => {
    return CommitConfigDefault;
  },
  defineSubCommands: ({ defineSubCommand }) => {
    return [
      defineSubCommand({
        name: "commit",
        description: "提交文件",
        action: async ({ finalUserConfig }) => {
          await commit({ finalUserConfig });
        },
      }),
      defineSubCommand({
        name: "commit-lint",
        description: "提交文件",
        options: {
          message: {
            alias: "-m",
            type: "string",
          },
        },
        action: async ({ finalUserConfig, args }) => {
          await commitLint({ finalUserConfig, message: args.message || "" });
        },
      }),
    ];
  },
});

// export class CommitCommand extends Command {
//   async task() {
//     const { finalUserConfig } = this;
//     await commit({ finalUserConfig });
//   }
// }
