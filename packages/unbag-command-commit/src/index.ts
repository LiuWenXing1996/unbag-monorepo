import { gitCz } from "./git-cz";
import { CommitConfig, CommitConfigDefault } from "./config";
import { commitLint } from "./lint";
import { CommandHelper, defineCommand, type FinalUserConfig } from "unbag";
import { initI18n } from "./i18n";

export const commit = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
  commandHelper: CommandHelper;
}) => {
  const { finalUserConfig, commandHelper } = params;
  await initI18n(commandHelper.locale);
  await gitCz({ finalUserConfig });
};

export const CommitCommand = defineCommand({
  defaultConfig: CommitConfigDefault,
  name: "commit",
  description: "提交文件",
  run: async ({ finalUserConfig, helper }) => {
    await commit({ finalUserConfig, commandHelper: helper });
  },
  subCommands: ({ defineSubCommand }) => {
    return [
      defineSubCommand({
        name: "lint",
        description: "提交文件",
        options: {
          message: {
            description: "需要校验的信息",
            type: "string",
          },
        },
        run: async ({ finalUserConfig, args, helper }) => {
          await commitLint({
            finalUserConfig,
            message: args.message || "",
            commandHelper: helper,
          });
        },
      }),
    ];
  },
});
