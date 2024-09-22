// import { FinalUserConfig } from "@/utils/config";
import { CommitConfig, loadCommitLintConfig } from "./config";
import lint from "@commitlint/lint";
// import { Command } from "@/core/command";
import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { FinalUserConfig } from "@/core/user-config";

export const commitLint = async (params: {
  finalUserConfig: FinalUserConfig<CommitConfig>;
  message: string;
}) => {
  const { finalUserConfig, message } = params;
  const log = useLog({ finalUserConfig });
  const messageMap = useMessage({ locale: finalUserConfig.base.locale });
  const lintConfig = await loadCommitLintConfig({ finalUserConfig });
  const report = await lint(message, lintConfig.rules, lintConfig);
  if (!report.valid) {
    report.errors.map((e) => {
      log.error(`${e.message}`);
    });
    report.warnings.map((e) => {
      log.warn(`${e.message}`);
    });
    throw new Error(messageMap.commit.lint.error({ message }));
  }
  log.info(messageMap.commit.lint.success({ message }));
};

// export class CommitLintCommand extends Command<string> {
//   async task(message: string) {
//     const { finalUserConfig } = this;
//     await commitLint({ finalUserConfig, message });
//   }
// }
