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
  defineActions: ({ defineAction }) => {
    return [
      defineAction({
        name: "commit",
        description: "提交文件",
        run: async ({ finalUserConfig }) => {
          await commit({ finalUserConfig });
        },
      }),
      defineAction({
        name: "commit-lint",
        description: "提交文件",
        options: {
          message: {
            alias: "-m",
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